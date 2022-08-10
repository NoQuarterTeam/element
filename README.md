# Element

## Typescript + React + Remix + Prisma

Comes with user authentication included

- [React](https://github.com/facebook/react)
- [Prisma](https://www.prisma.io)
- Remix
- TypeScript
- Postgres
- Chakra UI
- Customizable theme & Dark mode
- Eslint
- Prettier
- Sendgrid SMTP
- Husky
- Lint staged

& many more tasty treats

## Get Started

**Must have node and postgres installed and setup locally**

1. `npm i`
2. `createdb boilerplate`
3. `npm run db:push`

Make sure you have created a .env file in the api package with the right values, you can use .env.example as the template

We use Husky to run a couple of checks each commit (prettier, eslint & commitlint), make sure to add a
.huskyrc file to your home directory ~/.huskyrc, and add this in:

```bash
export PATH="/usr/local/bin:$PATH"
```

then run

```bash
npx husky install
```

## Development

`npm run dev`

## Production

### Mailers

- Create a Sendgrid account and set a SENDGRID_API_KEY environment variable in .env
- Create templates for each email you want to send and use the templateId in the corresponding mailer class

### Deployment

We are using Fly.io

### Extra info

- [Remix Docs](https://remix.run/docs)
