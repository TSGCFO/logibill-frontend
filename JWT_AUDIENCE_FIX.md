# JWT Audience Validation Fix - Step-by-Step Instructions

## Problem Summary
The frontend login works successfully, but users are immediately logged out when accessing the dashboard. The backend logs show:
```
WARNING:utils.auth:JWT validation error: Invalid audience
```

This happens because Supabase JWTs include an `aud` (audience) claim set to `"authenticated"`, but the backend JWT validation doesn't explicitly handle this claim, causing PyJWT to reject the token.

---

## Root Cause
In the file `utils/auth.py`, the `_validate_jwt_token()` function uses PyJWT's `jwt.decode()` without specifying the expected audience. When PyJWT encounters an `aud` claim in the token but no `audience` parameter is provided, it raises an `InvalidAudienceError`.

---

## Solution Overview
Modify the `_validate_jwt_token()` function to specify the expected audience value `"authenticated"` (which is what Supabase uses for authenticated user tokens).

---

## File to Modify
**Repository:** `TSGCFO/LogiBill`  
**File:** `utils/auth.py`

---

## Step-by-Step Fix

### Step 1: Locate the `_validate_jwt_token()` function

Find this function around **line 76-109** in `utils/auth.py`:

```python
def _validate_jwt_token(token: str) -> dict[str, Any]:
    """
    Validate JWT token using Supabase JWT secret.
    ...
    """
    if not SUPABASE_JWT_SECRET:
        logger.error('SUPABASE_JWT_SECRET environment variable not configured')
        raise AuthError('Server configuration error', status_code=500)

    try:
        # Decode and validate the JWT
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={
                'require': ['exp', 'sub'],
                'verify_exp': True,
                'verify_signature': True,
            }
        )
        return payload
    # ... exception handlers ...
```

### Step 2: Add the `audience` parameter

Modify the `jwt.decode()` call to include the `audience` parameter:

**BEFORE:**
```python
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            options={
                'require': ['exp', 'sub'],
                'verify_exp': True,
                'verify_signature': True,
            }
        )
```

**AFTER:**
```python
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            audience="authenticated",  # <-- ADD THIS LINE
            options={
                'require': ['exp', 'sub'],
                'verify_exp': True,
                'verify_signature': True,
            }
        )
```

### Step 3: Add specific exception handler for InvalidAudienceError (Optional but recommended)

Add a specific handler for audience errors to provide better debugging info. Add this after the existing `InvalidSignatureError` handler:

**Add this new exception handler:**
```python
    except jwt.InvalidAudienceError:
        logger.warning('JWT token has invalid audience')
        raise AuthError('Invalid token audience', status_code=401)
```

---

## Complete Modified Function

Here's the complete `_validate_jwt_token()` function after the fix:

```python
def _validate_jwt_token(token: str) -> dict[str, Any]:
    """
    Validate JWT token using Supabase JWT secret.

    Args:
        token: The JWT token string to validate.

    Returns:
        Decoded token payload.

    Raises:
        AuthError: If token is invalid, expired, or cannot be decoded.
    """
    if not SUPABASE_JWT_SECRET:
        logger.error('SUPABASE_JWT_SECRET environment variable not configured')
        raise AuthError('Server configuration error', status_code=500)

    try:
        # Decode and validate the JWT
        payload = jwt.decode(
            token,
            SUPABASE_JWT_SECRET,
            algorithms=[JWT_ALGORITHM],
            audience="authenticated",  # Supabase uses "authenticated" for logged-in users
            options={
                'require': ['exp', 'sub'],
                'verify_exp': True,
                'verify_signature': True,
            }
        )
        return payload

    except jwt.ExpiredSignatureError:
        logger.warning('JWT token has expired')
        raise AuthError('Token has expired', status_code=401)

    except jwt.InvalidSignatureError:
        logger.warning('JWT token has invalid signature')
        raise AuthError('Invalid token signature', status_code=401)

    except jwt.InvalidAudienceError:
        logger.warning('JWT token has invalid audience')
        raise AuthError('Invalid token audience', status_code=401)

    except jwt.DecodeError as e:
        logger.warning(f'JWT decode error: {e}')
        raise AuthError('Invalid token format', status_code=401)

    except jwt.InvalidTokenError as e:
        logger.warning(f'JWT validation error: {e}')
        raise AuthError('Token validation failed', status_code=401)
```

---

## Deployment Steps

After making the code change:

1. **Commit and push** the change to the `TSGCFO/LogiBill` repository
2. **Redeploy the backend** on Replit (the backend at https://logi-bill-hsadiq.replit.app)
3. **Test the fix:**
   - Log out from the frontend if currently logged in
   - Clear browser cookies/storage for the site (optional but recommended)
   - Log in again with `h.sadiq@tsgfulfillment.com`
   - Verify you stay on the dashboard without being redirected back to login

---

## Why This Works

Supabase issues JWTs with specific claims including:
- `sub`: The Supabase user ID (UUID)
- `aud`: Set to `"authenticated"` for logged-in users
- `exp`: Token expiration timestamp
- `role`: The Supabase role (usually `"authenticated"`)

By explicitly telling PyJWT to expect `audience="authenticated"`, the validation passes when it encounters tokens from Supabase.

---

## Verification

After deploying the fix, check the backend logs. You should no longer see:
```
WARNING:utils.auth:JWT validation error: Invalid audience
```

Instead, successful authentications will show:
```
DEBUG:utils.auth:Authenticated user: h.sadiq@tsgfulfillment.com (role: admin)
```
