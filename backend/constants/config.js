export const corsOptions = {
  origin: [
    'http://localhost:5173',
    'http://localhost:4173',
    ...(process.env.FRONTEND_ORIGIN ? process.env.FRONTEND_ORIGIN.split(',') : []),
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  credentials: true,
}

export const CHATTU_TOKEN = 'chattu-token'
export const ADMIN_TOKEN = 'chattu-admin-token'
