<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Redis;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    private const PENDING_REG_PREFIX = 'pending_registration:';
    private const PENDING_REG_TTL_SECONDS = 900;

    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register', 'verifyEmail', 'resendCode', 'redirectToGoogle', 'handleGoogleCallback']]);
        $this->syncAdminAccounts();
    }

    public function redirectToGoogle()
    {
        return Socialite::driver('google')
            ->stateless()
            ->redirect();
    }

    public function handleGoogleCallback()
    {
        $frontendCallback = rtrim(config('app.frontend_url'), '/') . '/auth/google/callback';

        try {
            $googleUser = Socialite::driver('google')->stateless()->user();
        } catch (\Throwable $e) {
            return redirect()->to($frontendCallback . '?error=google_auth_failed');
        }

        $email = strtolower(trim((string) $googleUser->getEmail()));

        if ($email === '') {
            return redirect()->to($frontendCallback . '?error=google_email_not_provided');
        }

        if ($this->isAdminEmail($email)) {
            return redirect()->to($frontendCallback . '?error=google_not_allowed_for_admin');
        }

        $user = User::where('email', $email)->first();

        if ($user) {
            if (empty($user->google_id)) {
                $user->google_id = $googleUser->getId();
            }

            if (!$user->email_verified_at) {
                $user->email_verified_at = now();
            }

            $user->save();
        } else {
            $user = User::create([
                'name' => $googleUser->getName() ?: ($googleUser->getNickname() ?: 'Google User'),
                'email' => $email,
                'google_id' => $googleUser->getId(),
                'password' => Hash::make(Str::random(32)),
                'email_verified_at' => now(),
            ]);
        }

        $token = auth()->login($user);
        $encodedUser = rawurlencode(json_encode($this->serializeUser($user)));

        return redirect()->to(
            $frontendCallback
            . '?token=' . rawurlencode($token)
            . '&user=' . $encodedUser
            . '&token_type=bearer'
        );
    }

    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8',
            'login_type' => 'nullable|string|in:user,admin',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $credentials = $validator->validated();
        $loginType = $credentials['login_type'] ?? 'user';
        $adminCredential = $this->findAdminCredential($credentials['email']);

        if ($loginType === 'admin' && !$adminCredential) {
            return response()->json(['error' => 'Only configured admin accounts can use admin login.'], 403);
        }

        if ($loginType === 'user' && $adminCredential) {
            return response()->json(['error' => 'Admin accounts must use admin login.'], 403);
        }

        // Admin emails are hard-locked to the configured passwords.
        if ($adminCredential && $credentials['password'] !== $adminCredential['password']) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        unset($credentials['login_type']);

        if (!$token = auth()->attempt($credentials)) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        return $this->respondWithToken($token);
    }

    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name'     => 'required|string|between:2,100',
            'email'    => 'required|string|email|max:100|unique:users',
            'password' => 'required|string|confirmed|min:8',
            'phone'    => 'nullable|string|max:20',
            'district' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if ($this->isAdminEmail($request->email)) {
            return response()->json([
                'message' => 'This email is reserved for admin access only.',
            ], 403);
        }

        $pendingKey = $this->pendingRegistrationKey($request->email);

        // Store registration data temporarily in Redis (TTL: 15 minutes)
        Redis::setex($pendingKey, self::PENDING_REG_TTL_SECONDS, json_encode([
            'name'     => $request->name,
            'email'    => $request->email,
            'password' => Hash::make($request->password),
            'phone'    => $request->phone,
            'district' => $request->district,
        ]));

        // Send verification code
        $verificationService = new VerificationService();
        $verificationService->createAndSendCode($request->email);

        return response()->json([
            'message'              => 'Registration initiated. Please check your email for a verification code.',
            'email'                => $request->email,
            'requires_verification' => true,
        ], 201);
    }

    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code'  => 'required|string|size:4',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $pendingKey = $this->pendingRegistrationKey($request->email);
        $pendingData = Redis::get($pendingKey);

        if (!$pendingData) {
            return response()->json([
                'message' => 'Registration session expired or not found. Please register again.',
                'error'   => 'session_expired',
            ], 400);
        }

        $verificationService = new VerificationService();

        if (!$verificationService->verifyCode($request->email, $request->code)) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
                'error'   => 'invalid_code',
            ], 400);
        }

        $data = json_decode($pendingData, true);

        // Commit to database
        $user = User::create([
            'name'              => $data['name'],
            'email'             => $data['email'],
            'password'          => $data['password'], // already hashed
            'phone'             => $data['phone'],
            'district'          => $data['district'],
            'email_verified_at' => now(),
        ]);

        // Clear Redis
        Redis::del($pendingKey);

        // Log the user in
        $token = auth()->login($user);

        return response()->json([
            'message'       => 'Email verified successfully. Account created.',
            'user'          => $this->serializeUser($user),
            'authorization' => [
                'token' => $token,
                'type'  => 'bearer',
            ],
        ], 201);
    }

    public function resendCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        // Check if already a committed user
        $existingUser = User::where('email', $request->email)->first();
        if ($existingUser && $existingUser->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        // Check Redis for pending registration
        $pendingKey = $this->pendingRegistrationKey($request->email);
        if (!Redis::exists($pendingKey)) {
            return response()->json([
                'message' => 'No pending registration found for this email. Please register again.',
                'error'   => 'no_pending_registration',
            ], 404);
        }

        $verificationService = new VerificationService();
        $verificationService->createAndSendCode($request->email);

        return response()->json([
            'message' => 'Verification code resent successfully.',
        ], 200);
    }

    public function logout()
    {
        auth()->logout();
        return response()->json(['message' => 'Successfully logged out']);
    }

    public function refresh()
    {
        return $this->respondWithToken(auth()->refresh());
    }

    public function me()
    {
        return response()->json($this->serializeUser(auth()->user()));
    }

    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type'   => 'bearer',
            'expires_in'   => auth()->factory()->getTTL() * 60,
            'user'         => $this->serializeUser(auth()->user()),
        ]);
    }

    private function pendingRegistrationKey($email)
    {
        return self::PENDING_REG_PREFIX . strtolower(trim($email));
    }

    private function serializeUser(User $user)
    {
        $userData = $user->toArray();
        $userData['role'] = $this->isAdminEmail($user->email) ? 'admin' : 'user';

        return $userData;
    }

    private function syncAdminAccounts()
    {
        foreach ($this->adminCredentials() as $admin) {
            $user = User::where('email', $admin['email'])->first();

            if (!$user) {
                User::create([
                    'name' => $admin['name'],
                    'email' => $admin['email'],
                    'password' => Hash::make($admin['password']),
                    'email_verified_at' => now(),
                ]);
                continue;
            }

            if (!Hash::check($admin['password'], $user->password)) {
                $user->password = Hash::make($admin['password']);
                if (!$user->email_verified_at) {
                    $user->email_verified_at = now();
                }
                $user->save();
            }
        }
    }

    private function adminCredentials()
    {
        $credentials = config('admin.credentials', []);

        return array_values(array_filter($credentials, function ($admin) {
            return isset($admin['email'], $admin['password'])
                && is_string($admin['email'])
                && is_string($admin['password'])
                && trim($admin['email']) !== ''
                && trim($admin['password']) !== '';
        }));
    }

    private function findAdminCredential($email)
    {
        $normalizedEmail = strtolower(trim($email));

        foreach ($this->adminCredentials() as $admin) {
            if (strtolower(trim($admin['email'])) === $normalizedEmail) {
                return [
                    'email' => strtolower(trim($admin['email'])),
                    'password' => $admin['password'],
                    'name' => $admin['name'] ?? 'Admin',
                ];
            }
        }

        return null;
    }

    private function isAdminEmail($email)
    {
        return $this->findAdminCredential($email) !== null;
    }
}