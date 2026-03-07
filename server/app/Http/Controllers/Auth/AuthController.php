<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\VerificationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     *
     * @return void
     */
    public function __construct()
    {
        $this->middleware('auth:api', ['except' => ['login', 'register', 'verifyEmail', 'resendCode']]);
    }

    /**
     * Get a JWT via given credentials.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'password' => 'required|string|min:8',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        if (!$token = auth()->attempt($validator->validated())) {
            return response()->json(['error' => 'Invalid credentials'], 401);
        }

        return $this->respondWithToken($token);
    }

    /**
     * Register a User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|between:2,100',
            'email' => 'required|string|email|max:100|unique:users',
            'password' => 'required|string|confirmed|min:8',
            'phone' => 'nullable|string|max:20',
            'district' => 'nullable|string|max:100',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone' => $request->phone,
            'district' => $request->district,
            'email_verified_at' => null, // Not verified yet
        ]);

        // Send verification code
        $verificationService = new VerificationService();
        $verificationService->createAndSendCode($user->email);

        return response()->json([
            'message' => 'Registration successful. Please check your email for verification code.',
            'email' => $user->email,
            'requires_verification' => true,
        ], 201);
    }

    /**
     * Verify email with OTP code.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyEmail(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
            'code' => 'required|string|size:4',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $verificationService = new VerificationService();
        
        if (!$verificationService->verifyCode($request->email, $request->code)) {
            return response()->json([
                'message' => 'Invalid or expired verification code.',
                'error' => 'invalid_code'
            ], 400);
        }

        // Mark user email as verified
        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        $user->email_verified_at = now();
        $user->save();

        // Log the user in
        $token = auth()->login($user);

        return response()->json([
            'message' => 'Email verified successfully.',
            'user' => $user,
            'authorization' => [
                'token' => $token,
                'type' => 'bearer',
            ]
        ], 200);
    }

    /**
     * Resend verification code.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function resendCode(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 422);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user) {
            return response()->json(['message' => 'User not found.'], 404);
        }

        if ($user->email_verified_at) {
            return response()->json(['message' => 'Email already verified.'], 400);
        }

        // Send new verification code
        $verificationService = new VerificationService();
        $verificationService->createAndSendCode($user->email);

        return response()->json([
            'message' => 'Verification code resent successfully.',
        ], 200);
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        auth()->logout();

        return response()->json(['message' => 'Successfully logged out']);
    }

    /**
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        return $this->respondWithToken(auth()->refresh());
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        return response()->json(auth()->user());
    }

    /**
     * Get the token array structure.
     *
     * @param  string $token
     *
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithToken($token)
    {
        return response()->json([
            'access_token' => $token,
            'token_type' => 'bearer',
            'expires_in' => auth()->factory()->getTTL() * 60,
            'user' => auth()->user()
        ]);
    }
}
