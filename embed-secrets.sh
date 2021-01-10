rm src/secrets.ts
touch src/secrets.ts

echo "export const secrets: {[key: string]: string} = {" > src/secrets.ts
echo "'stripe': '$STRIPE_SECRET'," >> src/secrets.ts
echo "};" >> src/secrets.ts
