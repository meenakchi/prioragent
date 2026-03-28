import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Login — redirect to Auth0
router.get('/login', (req: Request, res: Response) => {
  res.oidc.login({
    returnTo: process.env.FRONTEND_URL || 'http://localhost:5173',
    authorizationParams: {
      prompt: 'login',
    },
  });
});

// Logout
router.get('/logout', (req: Request, res: Response) => {
  res.oidc.logout({ returnTo: process.env.FRONTEND_URL || 'http://localhost:5173' });
});

router.get('/callback', (req: Request, res: Response) => {
  // Only reached after OIDC middleware finishes
  res.redirect(process.env.FRONTEND_URL || 'http://localhost:5173');
});

// Current user info
router.get('/me', (req: Request, res: Response) => {
  if (!req.oidc.isAuthenticated()) {
    res.json({ authenticated: false });
    return;
  }
  res.json({
    authenticated: true,
    user: {
      sub: req.oidc.user?.sub,
      name: req.oidc.user?.name,
      email: req.oidc.user?.email,
      picture: req.oidc.user?.picture,
    },
    accessToken: req.oidc.accessToken?.access_token,
  });
});

export default router;