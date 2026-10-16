# DeepSite

English | [中文](./README.md)

> This project is a modified version of [enzostvs/deepsite](https://huggingface.co/spaces/enzostvs/deepsite).

DeepSite is an application generation tool based on various large language models, allowing users to quickly generate various web applications through simple descriptions. The project is built using modern web technology stack, including React, TypeScript, Vite, and Express.

## Features

- Generate complete web applications based on natural language descriptions
- Built-in Vue, various components, and tool library templates
- Integrated code editor with real-time preview and editing
- English and Chinese language support
- Responsive design, adapting to various devices

## Requirements

- Node.js 18.x or higher
- npm or yarn package manager
- Docker and Docker Compose (for containerized deployment)

## Vercel Deployment

You can deploy to Vercel with one click using the button below:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?https://github.com/kiritoko1029/deepsite)

### Configure Vercel Environment Variables

During Vercel deployment, you need to configure the following environment variables:
> Any API provider that conforms to the OpenAI request and response format can be used. If not configured in the environment variables, you will need to configure it in the page settings.

| Environment Variable | Description | Example |
|---------|------|------|
| OPENAI_API_KEY | OpenAI or DeepSeek API key | sk-xxxxxxxxxxxxxxxx |
| OPENAI_MODEL | Model name to use | deepseek-chat/DeepSeek-V3-0324 or gpt-4o |
| OPENAI_BASE_URL | API base URL | https://api.deepseek.com/v1 or https://api.openai.com/v1 |
| IP_RATE_LIMIT | Maximum requests per hour per IP | 100 |

> Note: If IP_RATE_LIMIT is not set or set to a value less than or equal to 0, IP rate limiting will not be enabled.

Note: In Vercel deployment, due to the default timeout of 10s for the free version of Vercel, you need to configure **Function Max Duration** in the project's **Settings**. The maximum setting for the free version is 60s.

### Build Commands

In your Vercel project settings, ensure you set the correct build commands:

- **Build Command**: `npm run build`
- **Output Directory**: `dist`

## Local Development

### Environment Setup

1. Clone the repository:

```bash
git clone https://github.com/yourusername/deepsite.git
cd deepsite
```

2. Create an environment variable file:

```bash
cp .env.example .env
```

3. Edit the `.env` file and fill in the necessary API keys and configurations:

```
APP_PORT=3000
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o
OPENAI_BASE_URL=https://api.openai.com/v1
IP_RATE_LIMIT=100  # Max requests per hour per IP, set to 0 or omit to disable rate limiting
```

### Install Dependencies

```bash
npm install
```

### Run in Development Mode

```bash
npm run start:dev
```

The development server will run at http://localhost:5173

### Run in Production Mode
```bash
npm run build && npm run start
```
The production server runs by default at http://localhost:3000; the port can be configured via the `APP_PORT` variable in the `.env` file.

## Docker Deployment

### Using Docker Compose
> Docker image is available: `docker pull 195658/deepsite:latest`

1. Make sure Docker and Docker Compose are installed
2. Edit the `docker-compose.yml` file, setting the necessary environment variables:

```yaml
version: '3.8'

services:
  web:
    image: 195658/deepsite:latest
    ports:
      - "30002:3000"
    environment:
      - OPENAI_API_KEY=your_openai_api_key_here
      - OPENAI_MODEL=gpt-4o
      - OPENAI_BASE_URL=https://api.openai.com/v1
      - APP_PORT=3000
      - IP_RATE_LIMIT=100  # Max requests per hour per IP, set to 0 to disable limiting
    restart: unless-stopped
```

3. Build and start the container:

```bash
docker-compose up -d
```

The application will run at http://localhost:30002.

### Direct Docker Build

1. Build the Docker image:

```bash
docker build -t deepsite .
```

2. Run the container:

```bash
docker run -d -p 30002:3000 --name deepsite \
  -e OPENAI_API_KEY=your_openai_api_key_here \
  -e OPENAI_MODEL=gpt-4o \
  -e OPENAI_BASE_URL=https://api.openai.com/v1 \
  -e APP_PORT=3000 \
  -e IP_RATE_LIMIT=100 \
  deepsite
```

## Hugging Face Spaces Deployment

This project is configured to be deployed on Hugging Face Spaces. For configuration details, please refer to:
https://huggingface.co/docs/hub/spaces-config-reference

## Contribution Guidelines

Feel free to submit Issues and Pull Requests to help improve this project. Before submitting code, please ensure:

1. Follow existing code style
2. Add appropriate tests
3. Update relevant documentation

## License

MIT 