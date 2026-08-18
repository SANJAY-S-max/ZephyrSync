import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

const authService = new AuthService();

const registerSchema = z.object({
  username: z.string().min(3).max(30).regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain alphanumeric characters, underscores, and dashes'),
  password: z.string().min(6).max(100)
});

const loginSchema = z.object({
  username: z.string(),
  password: z.string()
});

export class AuthController {
  
  register = async (req: Request, res: Response) => {
    const validated = registerSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: validated.error.issues[0].message } });
    }

    const { user, session } = await authService.register(validated.data.username, validated.data.password, req.ip || req.socket.remoteAddress || '');
    
    res.cookie('sessionId', session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });

    res.json({ success: true, data: { id: user.id, username: user.username, role: user.role } });
  };

  login = async (req: Request, res: Response) => {
    const validated = loginSchema.safeParse(req.body);
    if (!validated.success) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Invalid payload' } });
    }

    const result = await authService.login(validated.data.username, validated.data.password, req.ip || req.socket.remoteAddress || '');
    if (!result) {
      return res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: 'Invalid credentials' } });
    }

    res.cookie('sessionId', result.session.id, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 30 * 24 * 60 * 60 * 1000
    });

    res.json({ success: true, data: { id: result.user.id, username: result.user.username, role: result.user.role } });
  };

  logout = async (req: Request, res: Response) => {
    const sessionId = req.cookies?.sessionId;
    if (sessionId) {
      await authService.logout(sessionId, req.user?.id, req.ip || req.socket.remoteAddress || '');
      res.clearCookie('sessionId');
    }
    res.json({ success: true });
  };

  me = async (req: Request, res: Response) => {
    res.json({ success: true, data: { id: req.user.id, username: req.user.username, role: req.user.role } });
  };
}
