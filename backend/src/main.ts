import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import { GlobalExceptionFilter } from './common/filters/http-exception.filter';
import { SensitiveDataInterceptor } from './common/interceptors/sensitive-data.interceptor';
import { json, urlencoded } from 'express';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule, { 
    rawBody: true,
    logger: process.env.NODE_ENV === 'production' ? ['error', 'warn', 'log'] : ['debug', 'error', 'log', 'verbose', 'warn'],
  });

  // Segurança básica com Helmet
  app.use(helmet());

  // Limite de tamanho de requisição para evitar ataques de DoS
  app.use(json({ limit: '10mb' }));
  app.use(urlencoded({ extended: true, limit: '10mb' }));

  // CORS configurável via env var
  // Dev: aceita qualquer porta localhost | Prod: definir CORS_ORIGIN=https://seu-dominio.com
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : /^https?:\/\/localhost(:\d+)?$/;

  app.enableCors({
    origin: allowedOrigins,
    methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
    credentials: true,
  });

  // Filtro de Exceções Global
  app.useGlobalFilters(new GlobalExceptionFilter());
  
  // Segurança: Interceptor para sanitizar dados sensíveis
  app.useGlobalInterceptors(new SensitiveDataInterceptor());

  // Validação global de DTOs robusta
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: process.env.NODE_ENV === 'production',
    }),
  );

  // Configuração do Swagger apenas em ambiente não-produção
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('The Burguer API')
      .setDescription('API Enterprise para gerenciamento de Hamburgueria')
      .setVersion('1.0')
      .addBearerAuth()
      .build();
    
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  }

  const port = process.env.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Application is running on port: ${port}`);
}

bootstrap().catch((err) => {
  console.error('Failed to start application', err);
  process.exit(1);
});