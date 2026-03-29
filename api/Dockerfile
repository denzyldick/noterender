FROM dunglas/frankenphp:1-php8.4

# Install system dependencies and PHP extensions for Symfony and SQLite
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libsqlite3-dev \
    && docker-php-ext-install zip pdo pdo_sqlite \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

# Install Composer natively
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory to the FrankenPHP root
WORKDIR /app

# Copy project package files
COPY composer.json composer.lock ./

# Install PHP dependencies without dev dependencies for production
ENV COMPOSER_ALLOW_SUPERUSER=1
RUN composer install --no-dev --optimize-autoloader --no-scripts

# Copy the rest of the application Source
COPY . .

# Run auto-scripts and set up permissions
RUN composer run-script post-install-cmd
RUN mkdir -p var data && chown -R www-data:www-data var data

