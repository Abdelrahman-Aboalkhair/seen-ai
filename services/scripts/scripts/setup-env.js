#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const readline = require("readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const question = (query) =>
  new Promise((resolve) => rl.question(query, resolve));

async function setupEnvironment() {
  console.log("🚀 Smart Recruiter Environment Setup\n");

  const envPath = path.join(process.cwd(), ".env.local");
  const examplePath = path.join(process.cwd(), "env.example");

  // Check if .env.local already exists
  if (fs.existsSync(envPath)) {
    const overwrite = await question(
      ".env.local already exists. Overwrite? (y/N): "
    );
    if (overwrite.toLowerCase() !== "y") {
      console.log("Setup cancelled.");
      rl.close();
      return;
    }
  }

  console.log("Please provide the following information:\n");

  // Get Supabase configuration
  const supabaseUrl = await question(
    "Supabase URL (e.g., https://your-project.supabase.co): "
  );
  const supabaseAnonKey = await question("Supabase Anonymous Key: ");

  // Get API configuration
  const apiBaseUrl =
    (await question("API Base URL (default: http://localhost:3000): ")) ||
    "http://localhost:3000";
  const appUrl =
    (await question("App URL (default: http://localhost:5173): ")) ||
    "http://localhost:5173";

  // Get optional configuration
  const openaiApiKey = await question("OpenAI API Key (optional): ");
  const stripePublishableKey = await question(
    "Stripe Publishable Key (optional): "
  );
  const appName =
    (await question("App Name (default: Smart Recruiter): ")) ||
    "Smart Recruiter";
  const appVersion =
    (await question("App Version (default: 1.0.0): ")) || "1.0.0";

  // Create environment file content
  const envContent = `# Environment Configuration
NODE_ENV=development

# Supabase Configuration
VITE_SUPABASE_URL=${supabaseUrl}
VITE_SUPABASE_ANON_KEY=${supabaseAnonKey}

# API Configuration
VITE_API_BASE_URL=${apiBaseUrl}
VITE_APP_URL=${appUrl}

# External APIs
${
  openaiApiKey
    ? `VITE_OPENAI_API_KEY=${openaiApiKey}`
    : "# VITE_OPENAI_API_KEY=your-openai-api-key"
}
${
  stripePublishableKey
    ? `VITE_STRIPE_PUBLISHABLE_KEY=${stripePublishableKey}`
    : "# VITE_STRIPE_PUBLISHABLE_KEY=your-stripe-publishable-key"
}

# App Configuration
VITE_APP_NAME=${appName}
VITE_APP_VERSION=${appVersion}
`;

  // Write the file
  try {
    fs.writeFileSync(envPath, envContent);
    console.log("\n✅ Environment file created successfully!");
    console.log(`📁 File location: ${envPath}`);
    console.log("\nNext steps:");
    console.log("1. Review the generated .env.local file");
    console.log("2. Start the development server: npm run dev");
    console.log(
      "3. For production, set these variables in your deployment platform"
    );
  } catch (error) {
    console.error("❌ Error creating environment file:", error.message);
  }

  rl.close();
}

// Run the setup
setupEnvironment().catch(console.error);
