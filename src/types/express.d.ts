declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
      };

      company?: {
        id: string;
      };
    }
  }
}

export {};