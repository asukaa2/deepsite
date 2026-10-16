// Template registry — single-file (HTML) + multi-file (full-stack) project templates.

const CDN_URLS = {
  // Vue
  VUE: "https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js",
  VUE_COMPOSITION_API: "https://unpkg.com/@vue/composition-api@1.7.2/dist/vue-composition-api.prod.js",
  // Vue component libraries
  ELEMENT_PLUS_CSS: "https://unpkg.com/element-plus@2.9.7/dist/index.css",
  ELEMENT_PLUS_JS: "https://unpkg.com/element-plus@2.9.7/dist/index.full.js",
  ELEMENT_PLUS_ICONS: "https://cdn.jsdelivr.net/npm/@element-plus/icons-vue",
  NAIVE_UI: "https://unpkg.com/naive-ui@2.41.0/dist/index.prod.js",
  // Tailwind
  TAILWIND: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
  // React Native Web (Android/iOS-style UI rendered in the browser)
  REACT_NATIVE_WEB: "https://unpkg.com/react-native-web@0.20.0/dist/react-native-web.min.js",
  REACT: "https://unpkg.com/react@18.3.1/umd/react.production.min.js",
  REACT_DOM: "https://unpkg.com/react-dom@18.3.1/umd/react-dom.production.min.js",
  REACT_BABEL: "https://unpkg.com/@babel/standalone@7.26.4/babel.min.js",
  // Material 3 (Android-style) — Material Web Components
  MATERIAL_WEB: "https://cdn.jsdelivr.net/npm/@material/web@2.3.0/all.min.js",
  MATERIAL_TYPOGRAPHY: "https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&family=Material+Symbols+Outlined",
  // Utilities
  VUEUSE_SHARED: "https://unpkg.com/@vueuse/shared@13.0.0/index.iife.min.js",
  VUEUSE_CORE: "https://unpkg.com/@vueuse/core@13.0.0/index.iife.min.js",
  DAYJS: "https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js",
};

const TEMPLATES = {
  // ---------- Basic ----------
  vanilla: {
    name: "TailwindCSS HTML",
    description: "Single self-contained HTML file with TailwindCSS via CDN.",
    systemPrompt: `ONLY USE HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Please write clear and helpful comments in your code to explain the structure and functionality. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src="${CDN_URLS.TAILWIND}"></script> in the head). Also, try to elaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>TailwindCSS HTML</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <script src="${CDN_URLS.TAILWIND}"></script>
    <style>body { font-family: system-ui, -apple-system, sans-serif; }</style>
  </head>
  <body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
    <main class="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-md overflow-hidden">
      <div class="p-8">
        <h1 class="text-2xl font-bold text-gray-800 mb-2">Hello, DeepSite</h1>
        <p class="text-gray-600 mb-4">Describe the page you want to build in the chat.</p>
        <button class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md">Get started</button>
      </div>
    </main>
  </body>
</html>`,
  },

  vue3: {
    name: "Vue 3",
    description: "Vue 3 (CDN) with TailwindCSS. Demands strong model capability.",
    systemPrompt: `ONLY USE VUE 3 WITH HTML, CSS AND JAVASCRIPT. Create a Vue 3 application using the CDN version (${CDN_URLS.VUE}). Structure your code with Vue 3 components, reactivity, and proper Vue syntax. Please write clear and helpful comments in your code to explain the structure and functionality. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src="${CDN_URLS.TAILWIND}"></script> in the head). Also, try to elaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>Vue 3 Starter</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <script src="${CDN_URLS.VUE}"></script>
    <script src="${CDN_URLS.TAILWIND}"></script>
    <style>[v-cloak] { display: none; }</style>
  </head>
  <body class="bg-gray-50">
    <div id="app" v-cloak class="min-h-screen p-4">
      <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-10">
        <div class="p-6">
          <h1 class="text-2xl font-bold text-gray-800 mb-2">Vue 3 Demo</h1>
          <p class="text-gray-600 mb-4">Counter: {{ counter }}</p>
          <button @click="counter++" class="bg-emerald-500 text-white py-1 px-3 rounded">Increment</button>
        </div>
      </div>
    </div>
    <script>
      const { createApp, ref } = Vue;
      createApp({ setup() { const counter = ref(0); return { counter }; } }).mount('#app');
    </script>
  </body>
</html>`,
  },

  // ---------- Mobile (Android / iOS-style) ----------
  "react-native-web": {
    name: "React Native Web",
    description: "React Native components rendered in the browser via react-native-web. Android/iOS-style UI.",
    systemPrompt: `Create a React Native application that runs in the browser via react-native-web. Use React ${CDN_URLS.REACT}, ReactDOM ${CDN_URLS.REACT_DOM}, Babel standalone ${CDN_URLS.REACT_BABEL} for JSX transpilation, and react-native-web ${CDN_URLS.REACT_NATIVE_WEB} for the native primitives (View, Text, TextInput, ScrollView, FlatList, TouchableOpacity, Pressable, StyleSheet, etc.).

IMPORTANT RULES:
1. ALL JSX must be inside a <script type="text/babel"> block in the HTML body.
2. Set window.React = React; window.ReactDOM = ReactDOM; at the top of your script so react-native-web can find them.
3. Use ONLY react-native-web components — do NOT use <div>, <span>, <p>, <button> HTML tags. Use <View>, <Text>, <TextInput>, <TouchableOpacity>, <ScrollView>, <FlatList>, <Image>, <Switch>, etc.
4. Apply styles via StyleSheet.create() and the style prop. Do NOT use Tailwind or CSS classes on RN components.
5. The root component must call ReactDOM.createRoot(document.getElementById('root')).render(<App/>).
6. Make it look like a real mobile app — SafeAreaView, navigation header, list, fab button, etc.
7. The page must fit a mobile viewport (max-width: 480px, centered on desktop).
8. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE.`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>React Native Web</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
    <meta charset="utf-8">
    <script src="${CDN_URLS.REACT}"></script>
    <script src="${CDN_URLS.REACT_DOM}"></script>
    <script src="${CDN_URLS.REACT_NATIVE_WEB}"></script>
    <script src="${CDN_URLS.REACT_BABEL}"></script>
    <style>
      body { margin: 0; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
      #root { display: flex; justify-content: center; min-height: 100vh; }
      #root > div { width: 100%; max-width: 480px; box-shadow: 0 0 40px rgba(0,0,0,0.4); }
    </style>
  </head>
  <body>
    <div id="root"></div>
    <script type="text/babel">
      const React = window.React;
      const ReactDOM = window.ReactDOM;
      const RN = window.ReactNativeWeb;
      const { View, Text, ScrollView, TouchableOpacity, StyleSheet, SafeAreaView, TextInput, FlatList } = RN;

      function App() {
        const [items, setItems] = React.useState([
          { id: '1', title: 'Welcome to RN Web', subtitle: 'Tap to see details' },
          { id: '2', title: 'Build mobile UIs', subtitle: 'With familiar React' },
          { id: '3', title: 'Preview on phone', subtitle: 'Use the mobile toggle' },
        ]);
        const renderItem = ({ item }) => (
          <TouchableOpacity style={styles.card} activeOpacity={0.7}>
            <Text style={styles.cardTitle}>{item.title}</Text>
            <Text style={styles.cardSubtitle}>{item.subtitle}</Text>
          </TouchableOpacity>
        );
        return (
          <SafeAreaView style={styles.container}>
            <View style={styles.header}>
              <Text style={styles.headerTitle}>My App</Text>
            </View>
            <FlatList
              data={items}
              renderItem={renderItem}
              keyExtractor={(i) => i.id}
              contentContainerStyle={styles.list}
            />
          </SafeAreaView>
        );
      }

      const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: '#0a0a0a' },
        header: { padding: 18, backgroundColor: '#1a1a1d', borderBottomWidth: 1, borderBottomColor: '#2a2a30' },
        headerTitle: { color: '#fff', fontSize: 20, fontWeight: '600' },
        list: { padding: 16 },
        card: { backgroundColor: '#1a1a1d', padding: 16, borderRadius: 12, marginBottom: 12, borderWidth: 1, borderColor: '#2a2a30' },
        cardTitle: { color: '#fff', fontSize: 16, fontWeight: '500' },
        cardSubtitle: { color: '#8a8a93', fontSize: 13, marginTop: 4 },
      });

      ReactDOM.createRoot(document.getElementById('root')).render(<App />);
    </script>
  </body>
</html>`,
  },

  "material-android": {
    name: "Material 3 (Android-style)",
    description: "Material Design 3 web components — Android-native look and feel.",
    systemPrompt: `Create a Material 3 (Material You) styled web page using @material/web components (${CDN_URLS.MATERIAL_WEB}) and Material Symbols Outlined icons (${CDN_URLS.MATERIAL_TYPOGRAPHY}). The result should look like a native Android app screen.

RULES:
1. Import @material/web/all.min.js as a module: <script type="module" src="${CDN_URLS.MATERIAL_WEB}"></script>
2. Use Material 3 color tokens: a vibrant primary, surface tones, on-surface text. Suggest using a dark surface (#1C1B1F) with a purple/teal primary accent (#6750A4 default M3 baseline).
3. Use custom element names: <md-filled-button>, <md-outlined-button>, <md-text-field>, <md-checkbox>, <md-switch>, <md-list>, <md-fab>, <md-icon-button>, <md-icon>symbol_name</md-icon>.
4. Apply Material 3 typography (Roboto), corner radius (12-28px), elevation via box-shadow.
5. Include an Android-style top app bar with title + actions, a scrollable content area, and a FAB in the bottom-right.
6. The viewport should be constrained to a mobile width (max 480px, centered on desktop).
7. Use TailwindCSS (${CDN_URLS.TAILWIND}) only for layout utilities — component styling should be Material-flavoured custom CSS.
8. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE.`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>Material 3 Demo</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta charset="utf-8">
    <link rel="stylesheet" href="${CDN_URLS.MATERIAL_TYPOGRAPHY}">
    <script src="${CDN_URLS.TAILWIND}"></script>
    <script type="module" src="${CDN_URLS.MATERIAL_WEB}"></script>
    <style>
      body { margin: 0; background: #141318; font-family: 'Roboto', system-ui, sans-serif; color: #E6E1E5; }
      #app { max-width: 480px; margin: 0 auto; min-height: 100vh; background: #141318; box-shadow: 0 0 40px rgba(0,0,0,0.4); }
      .top-bar { padding: 16px 20px; background: #1C1B1F; display: flex; align-items: center; justify-content: space-between; border-bottom: 1px solid #2A2730; position: sticky; top: 0; z-index: 10; }
      .top-bar h1 { font-size: 20px; font-weight: 500; margin: 0; color: #E6E1E5; }
      .content { padding: 20px; }
      .card { background: #211F26; border-radius: 16px; padding: 20px; margin-bottom: 16px; border: 1px solid #2A2730; }
      .card h2 { font-size: 18px; font-weight: 500; margin: 0 0 8px; color: #E6E1E5; }
      .card p { font-size: 14px; color: #CAC4D0; margin: 0; line-height: 1.5; }
      md-filled-button { --md-filled-button-container-color: #6750A4; --md-filled-button-label-text-color: #fff; }
      md-fab { --md-fab-container-color: #6750A4; --md-fab-icon-color: #fff; position: fixed; bottom: 24px; right: max(24px, calc(50vw - 240px + 24px)); }
      .icon-btn { color: #CAC4D0; }
    </style>
  </head>
  <body>
    <div id="app">
      <div class="top-bar">
        <h1>Material 3</h1>
        <md-icon-button class="icon-btn"><md-icon>more_vert</md-icon></md-icon-button>
      </div>
      <div class="content">
        <div class="card">
          <h2>Welcome to Material 3</h2>
          <p>This UI uses @material/web components with the Material You baseline color scheme.</p>
          <md-filled-button style="margin-top: 12px;">
            <md-icon slot="icon">add</md-icon>
            Get Started
          </md-filled-button>
        </div>
        <div class="card">
          <h2>Components</h2>
          <p>Filled buttons, outlined fields, switches, and FABs are all available.</p>
        </div>
      </div>
      <md-fab><md-icon>add</md-icon></md-fab>
    </div>
  </body>
</html>`,
  },

  // ---------- Full-Stack (multi-file project mode) ----------
  "nextjs-fullstack": {
    name: "Next.js Full-Stack",
    description: "Multi-file project: Next.js app with API routes. Preview shows a stitched-together HTML demo; full source available in editor tabs.",
    systemPrompt: `You are building a Next.js full-stack application. The user wants a complete multi-file project.

OUTPUT FORMAT — CRITICAL:
You MUST wrap every file in markers exactly like this:

<!--file:app/layout.tsx-->
\`\`\`tsx
// file content
\`\`\`
<!--/file-->

<!--file:app/page.tsx-->
\`\`\`tsx
// file content
\`\`\`
<!--/file-->

<!--file:app/api/hello/route.ts-->
\`\`\`ts
// file content
\`\`\`
<!--/file-->

Rules:
1. Use the Next.js 14 App Router conventions (app/ directory, server components, route handlers).
2. Include at minimum: app/layout.tsx, app/page.tsx, app/globals.css, and at least one API route under app/api/.
3. Include package.json with the necessary dependencies.
4. Include a README.md with run instructions.
5. At the END of your response, after all file blocks, include ONE compiled HTML preview that demonstrates the UI by stitching together the page.tsx output as plain HTML + TailwindCSS via CDN. This preview must start with <!DOCTYPE html> and end with </html>. The preview should call the API route via a fetch() to a mock endpoint defined inline.
6. Use TailwindCSS for styling in the preview and in app/globals.css.
7. Make the demo realistic — show loading states, error handling, and at least one interactive element.

Always include the file markers exactly as shown. The frontend will parse them and show each file in its own editor tab.`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>Next.js Full-Stack Preview</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <script src="${CDN_URLS.TAILWIND}"></script>
  </head>
  <body class="bg-zinc-950 text-zinc-100 min-h-screen p-8">
    <main class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-2">Next.js Full-Stack</h1>
      <p class="text-zinc-400 mb-6">Project initialized. Describe what you want to build in the chat — files will appear in the explorer as the model streams them.</p>
      <div class="bg-zinc-900 border border-zinc-800 rounded-lg p-4">
        <div class="text-xs text-zinc-500 uppercase tracking-wider mb-1">API Route</div>
        <code class="text-emerald-400 font-mono text-sm">/api/hello → { "message": "Hello, world!" }</code>
      </div>
    </main>
  </body>
</html>`,
  },

  "express-react": {
    name: "Express + React",
    description: "Multi-file project: Express backend + React frontend. Multi-file project mode with editor tabs.",
    systemPrompt: `You are building a full-stack app: an Express.js backend serving a React frontend.

OUTPUT FORMAT — CRITICAL:
Wrap every file in markers exactly like this:

<!--file:server/index.js-->
\`\`\`js
// file content
\`\`\`
<!--/file-->

<!--file:client/App.jsx-->
\`\`\`jsx
// file content
\`\`\`
<!--/file-->

<!--file:package.json-->
\`\`\`json
{ }
\`\`\`
<!--/file-->

Rules:
1. Include: server/index.js (Express with at least 2 API routes), client/App.jsx (root React component), client/main.jsx (entry), client/index.html, server/routes/ (with at least one router file), package.json, README.md.
2. Use Vite for the frontend dev server config OR use a single bundled HTML — but every file must be its own file block.
3. At the END, include ONE compiled HTML preview starting with <!DOCTYPE html>. This preview must:
   - Import React + ReactDOM + Babel standalone CDNs.
   - Embed the React component inline as <script type="text/babel">.
   - Mock the Express API responses with a small fetch() interceptor.
   - Demonstrate the UI: data fetching, loading state, and at least one interaction.
4. Use TailwindCSS (${CDN_URLS.TAILWIND}) for styling.

Always include the file markers exactly as shown.`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>Express + React Preview</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <script src="${CDN_URLS.TAILWIND}"></script>
  </head>
  <body class="bg-zinc-950 text-zinc-100 min-h-screen p-8">
    <main class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-2">Express + React</h1>
      <p class="text-zinc-400 mb-6">Multi-file project initialized. Describe your app in the chat.</p>
    </main>
  </body>
</html>`,
  },

  "mern-stack": {
    name: "MERN Stack",
    description: "Multi-file project: MongoDB + Express + React + Node. Full MERN scaffold.",
    systemPrompt: `You are building a MERN-stack application (MongoDB + Express + React + Node).

OUTPUT FORMAT — CRITICAL:
Wrap every file in markers exactly like this:

<!--file:server/models/Item.js-->
\`\`\`js
// file content
\`\`\`
<!--/file-->

Rules:
1. Include:
   - server/server.js (Express app entry, Mongoose connection)
   - server/models/<Name>.js (at least one Mongoose model)
   - server/routes/<name>.js (REST CRUD routes)
   - server/controllers/<name>.js (controllers)
   - client/src/App.jsx (React UI consuming the REST API)
   - client/src/main.jsx (entry)
   - client/index.html
   - .env.example
   - package.json (with concurrently script for both server and client)
   - README.md (with setup, env vars, and run commands)
2. At the END, include ONE compiled HTML preview starting with <!DOCTYPE html>. This preview must:
   - Import React + ReactDOM + Babel CDNs.
   - Render the React UI inline.
   - Mock the Mongoose/Express REST API with fetch() interceptors returning realistic data.
   - Show a CRUD demo (list, create, update, delete).
3. Use TailwindCSS (${CDN_URLS.TAILWIND}) for styling.

Always include the file markers exactly as shown.`,
    html: `<!DOCTYPE html>
<html>
  <head>
    <title>MERN Stack Preview</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <script src="${CDN_URLS.TAILWIND}"></script>
  </head>
  <body class="bg-zinc-950 text-zinc-100 min-h-screen p-8">
    <main class="max-w-2xl mx-auto">
      <h1 class="text-3xl font-bold mb-2">MERN Stack</h1>
      <p class="text-zinc-400 mb-6">Multi-file project initialized. Describe your app in the chat.</p>
    </main>
  </body>
</html>`,
  },
};

export { TEMPLATES, CDN_URLS };
