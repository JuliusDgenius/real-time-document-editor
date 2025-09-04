## Deployment

### **Phase 1: Containerization & Local Deployment**

#### Docker Setup

1. **Backend Containerization**
   ```bash
   # Create Dockerfile in backend directory
   FROM node:18-alpine
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci --only=production
   COPY . .
   EXPOSE 3000
   CMD ["npm", "start"]
   ```

2. **Frontend Containerization**
   ```bash
   # Create Dockerfile in frontend directory
   FROM node:18-alpine AS builder
   WORKDIR /app
   COPY package*.json ./
   RUN npm ci
   COPY . .
   RUN npm run build

   FROM nginx:alpine
   COPY --from=builder /app/dist /usr/share/nginx/html
   COPY nginx.conf /etc/nginx/nginx.conf
   EXPOSE 80
   ```

3. **Docker Compose for Local Testing**
   ```yaml
   # docker-compose.yml
   version: '3.8'
   services:
     postgres:
       image: postgres:15
       environment:
         POSTGRES_DB: collab_editor
         POSTGRES_USER: postgres
         POSTGRES_PASSWORD: password
       volumes:
         - postgres_data:/var/lib/postgresql/data
       ports:
         - "5432:5432"

     backend:
       build: ./backend
       ports:
         - "3000:3000"
       environment:
         DATABASE_URL: postgresql://postgres:password@postgres:5432/collab_editor
         JWT_SECRET: your-secret-key
       depends_on:
         - postgres

     frontend:
       build: ./frontend
       ports:
         - "3001:80"
       depends_on:
         - backend

   volumes:
     postgres_data:
   ```

#### Local Deployment Commands
   ```bash
   # Build and run locally
   docker-compose up --build
   
   # Test the full stack
   curl http://localhost:3000/api/health
   curl http://localhost:3001
   ```

### **Phase 2: Cloud Infrastructure Setup**

#### Environment Configuration

1. **Environment Variables Management**
   ```bash
   # .env.production
   NODE_ENV=production
   DATABASE_URL=your_production_db_url
   JWT_SECRET=your_production_jwt_secret
   SOCKET_CORS_ORIGIN=https://yourdomain.com
   REDIS_URL=your_redis_url
   ```

2. **Secrets Management**
   - Use cloud provider secret managers (Azure Key Vault, AWS Secrets Manager)
   - Never commit secrets to version control
   - Rotate secrets regularly

#### Database Setup

1. **PostgreSQL on Cloud**
   - **Azure**: Azure Database for PostgreSQL (Flexible Server)
   - **AWS**: RDS PostgreSQL
   - **Google Cloud**: Cloud SQL for PostgreSQL
   - **Railway**: Managed PostgreSQL

2. **Redis for Scaling (Phase 3+)**
   - **Azure**: Azure Cache for Redis
   - **AWS**: ElastiCache for Redis
   - **Railway**: Managed Redis

### **Phase 3: Backend Deployment**

#### Azure Deployment (Recommended)

1. **Azure Container Registry (ACR)**
   ```bash
   # Create ACR
   az acr create --resource-group your-rg --name your-acr --sku Basic
   
   # Build and push backend image
   docker build -t your-acr.azurecr.io/collab-backend:latest ./backend
   docker push your-acr.azurecr.io/collab-backend:latest
   ```

2. **Azure Container Instances (ACI)**
   ```bash
   # Deploy backend container
   az container create \
     --resource-group your-rg \
     --name collab-backend \
     --image your-acr.azurecr.io/collab-backend:latest \
     --ports 3000 \
     --environment-variables \
       DATABASE_URL=$DATABASE_URL \
       JWT_SECRET=$JWT_SECRET \
       NODE_ENV=production
   ```

3. **Azure App Service (Alternative)**
   ```bash
   # Create App Service
   az webapp create \
     --resource-group your-rg \
     --plan your-plan \
     --name collab-backend \
     --deployment-container-image-name your-acr.azurecr.io/collab-backend:latest
   ```

#### Railway Deployment (Simpler Alternative)

1. **Connect GitHub Repository**
   - Link your repo to Railway
   - Set environment variables in Railway dashboard
   - Auto-deploy on push to main branch

2. **Railway Configuration**
   ```json
   // railway.json
   {
     "build": {
       "builder": "DOCKERFILE",
       "dockerfilePath": "./backend/Dockerfile"
     },
     "deploy": {
       "startCommand": "npm start",
       "healthcheckPath": "/api/health",
       "healthcheckTimeout": 300,
       "restartPolicyType": "ON_FAILURE"
     }
   }
   ```

### **Phase 4: Frontend Deployment**

#### Vercel Deployment (Recommended)

1. **Connect Repository**
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from frontend directory
   cd frontend
   vercel --prod
   ```

2. **Vercel Configuration**
   ```json
   // vercel.json
   {
     "buildCommand": "npm run build",
     "outputDirectory": "dist",
     "framework": "vite",
     "rewrites": [
       {
         "source": "/api/(.*)",
         "destination": "https://your-backend-url.com/api/$1"
       }
     ]
   }
   ```

#### Netlify Deployment (Alternative)

1. **Netlify Configuration**
   ```toml
   # netlify.toml
   [build]
     publish = "dist"
     command = "npm run build"
   
   [[redirects]]
     from = "/api/*"
     to = "https://your-backend-url.com/api/:splat"
     status = 200
   ```

### **Phase 5: CI/CD Pipeline**

#### GitHub Actions Workflow

1. **Backend CI/CD**
   ```yaml
   # .github/workflows/backend-deploy.yml
   name: Backend Deploy
   
   on:
     push:
       branches: [main]
       paths: ['backend/**']
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: cd backend && npm ci
         - run: cd backend && npm test
   
     deploy:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Deploy to Azure
           uses: azure/aci-deploy@v1
           with:
             resource-group: ${{ secrets.AZURE_RG }}
             dns-name-label: ${{ secrets.AZURE_DNS }}
             image: ${{ secrets.ACR_NAME }}.azurecr.io/collab-backend:${{ github.sha }}
   ```

2. **Frontend CI/CD**
   ```yaml
   # .github/workflows/frontend-deploy.yml
   name: Frontend Deploy
   
   on:
     push:
       branches: [main]
       paths: ['frontend/**']
   
   jobs:
     test:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - uses: actions/setup-node@v3
           with:
             node-version: '18'
         - run: cd frontend && npm ci
         - run: cd frontend && npm test
   
     deploy:
       needs: test
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v3
         - name: Deploy to Vercel
           uses: amondnet/vercel-action@v25
           with:
             vercel-token: ${{ secrets.VERCEL_TOKEN }}
             vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
             vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
             working-directory: ./frontend
   ```

### **Phase 6: Monitoring & Observability**

#### Health Checks & Monitoring

1. **Backend Health Endpoint**
   ```typescript
   // Add to your backend
   app.get('/api/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       uptime: process.uptime(),
       database: 'connected', // Check DB connection
       memory: process.memoryUsage()
     });
   });
   ```

2. **Frontend Health Monitoring**
   ```typescript
   // Add to your frontend
   const healthCheck = async () => {
     try {
       const response = await fetch('/api/health');
       if (!response.ok) throw new Error('Backend unhealthy');
     } catch (error) {
       console.error('Health check failed:', error);
       // Show user-friendly error message
     }
   };
   
   // Check every 30 seconds
   setInterval(healthCheck, 30000);
   ```

#### Logging & Error Tracking

1. **Structured Logging**
   ```typescript
   // Add to backend
   import winston from 'winston';
   
   const logger = winston.createLogger({
     level: 'info',
     format: winston.format.json(),
     transports: [
       new winston.transports.File({ filename: 'error.log', level: 'error' }),
       new winston.transports.File({ filename: 'combined.log' })
     ]
   });
   ```

2. **Error Tracking Service**
   - **Sentry**: Free tier for error monitoring
   - **LogRocket**: Session replay and error tracking
   - **Azure Application Insights**: If using Azure

### **Phase 7: Performance & Scaling**

#### CDN & Caching

1. **Vercel Edge Functions**
   ```typescript
   // api/cache.ts
   export default function handler(req, res) {
     res.setHeader('Cache-Control', 'public, max-age=3600');
     res.json({ message: 'Cached response' });
   }
   ```

2. **Redis Caching (Backend)**
   ```typescript
   // Add Redis caching for document content
   const cacheDocument = async (docId: string, content: string) => {
     await redis.setex(`doc:${docId}`, 3600, content);
   };
   ```

#### Load Balancing & Scaling

1. **Horizontal Scaling with Redis**
   ```typescript
   // Scale Socket.IO across multiple instances
   import { createAdapter } from '@socket.io/redis-adapter';
   
   const pubClient = createClient({ url: process.env.REDIS_URL });
   const subClient = pubClient.duplicate();
   
   io.adapter(createAdapter(pubClient, subClient));
   ```

### **Deployment Checklist**

#### Pre-Deployment
- [ ] All tests passing
- [ ] Environment variables configured
- [ ] Database migrations ready
- [ ] SSL certificates obtained
- [ ] Domain DNS configured

#### Post-Deployment
- [ ] Health checks passing
- [ ] Database connections working
- [ ] Socket connections established
- [ ] Frontend can reach backend
- [ ] Real-time collaboration working
- [ ] Performance monitoring active

#### Maintenance
- [ ] Regular security updates
- [ ] Database backups scheduled
- [ ] Log rotation configured
- [ ] Error alerts configured
- [ ] Performance metrics tracked

### **Cost Optimization**

#### Azure Cost Management
- Use Azure Container Instances for dev/testing
- Scale down during off-hours
- Monitor usage with Azure Cost Management

#### Alternative Free Tiers
- **Railway**: $5/month for small projects
- **Render**: Free tier available
- **Vercel**: Generous free tier
- **Netlify**: Free tier available

### **Security Considerations**

1. **HTTPS Everywhere**
   - Force HTTPS redirects
   - Use HSTS headers
   - Secure cookie settings

2. **API Security**
   - Rate limiting
   - CORS configuration
   - Input validation
   - SQL injection prevention

3. **Authentication Security**
   - JWT token expiration
   - Refresh token rotation
   - Secure password hashing

---

## License

This project is licensed under the ISC License.
