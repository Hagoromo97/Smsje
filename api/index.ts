// This file is kept for Vercel routing compatibility
// The actual server runs as a Node.js app, not serverless functions
// Vercel will detect and run this as a standard Node.js application

export default function handler(req: any, res: any) {
  res.status(200).json({ 
    message: 'API is running. Please use the main server endpoint.' 
  });
}
