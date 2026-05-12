#!/bin/bash

# Suppress interactive prompts using echo piping
echo "postgresql://neondb_owner:npg_0f3IGACWkVTe@ep-snowy-bar-amn7qd8u-pooler.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require" | npx vercel env add DATABASE_URL production
echo "postgresql://neondb_owner:npg_0f3IGACWkVTe@ep-snowy-bar-amn7qd8u.c-5.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require" | npx vercel env add DIRECT_URL production
echo "DPeElPOPPuPU9ApaCLNSf+SJiVn8wn0EIBA1ePzPkUE=" | npx vercel env add NEXTAUTH_SECRET production
echo "https://carmarket-gcb5cbhmr-shwetankfkboi-2081s-projects.vercel.app" | npx vercel env add NEXTAUTH_URL production
echo "demo" | npx vercel env add CLOUDINARY_CLOUD_NAME production
echo "123456789012345" | npx vercel env add CLOUDINARY_API_KEY production
echo "dummy_secret_value" | npx vercel env add CLOUDINARY_API_SECRET production

echo "Environment variables added successfully."
