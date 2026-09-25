// 统一管理CDN地址
const CDN_URLS = {
  // Vue相关
  VUE: "https://unpkg.com/vue@3.5.13/dist/vue.global.prod.js",
  VUE_COMPOSITION_API: "https://unpkg.com/@vue/composition-api@1.7.2/dist/vue-composition-api.prod.js",
  
  // 组件库
  ELEMENT_PLUS_CSS: "https://unpkg.com/element-plus@2.9.7/dist/index.css",
  ELEMENT_PLUS_JS: "https://unpkg.com/element-plus@2.9.7/dist/index.full.js",
  ELEMENT_PLUS_ICONS: "https://cdn.jsdelivr.net/npm/@element-plus/icons-vue",
  NAIVE_UI: "https://unpkg.com/naive-ui@2.41.0/dist/index.prod.js",
  
  // 工具库
  TAILWIND: "https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4",
  VUEUSE_SHARED: "https://unpkg.com/@vueuse/shared@13.0.0/index.iife.min.js",
  VUEUSE_CORE: "https://unpkg.com/@vueuse/core@13.0.0/index.iife.min.js",
  DAYJS: "https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"
};

const TEMPLATES = {
    vanilla: {
      name: "TailwindCSS HTML",
      description: "相较于原生HTML，使用TailwindCSS构建的HTML更加美观，更加易于维护。",
      systemPrompt: `ONLY USE HTML, CSS AND JAVASCRIPT. If you want to use ICON make sure to import the library first. Try to create the best UI possible by using only HTML, CSS and JAVASCRIPT. Please write clear and helpful comments in your code to explain the structure and functionality. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src="${CDN_URLS.TAILWIND}"></script> in the head). Also, try to ellaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`,
      html: `<!DOCTYPE html>
  <html>
    <head>
      <title>TailwindCSS HTML</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="utf-8">
      <script src="${CDN_URLS.TAILWIND}"></script>
      <style>
        body {
          font-family: system-ui, -apple-system, sans-serif;
        }
      </style>
    </head>
    <body class="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <main class="max-w-md mx-auto mt-12 bg-white rounded-xl shadow-md overflow-hidden">
        <div class="p-8">
          <div class="flex justify-between items-center mb-4">
            <div class="text-indigo-500 font-medium">原生HTML + Tailwind CSS</div>
            <div class="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800">演示</div>
          </div>
          <h1 class="text-2xl font-bold text-gray-800 mb-2">简洁HTML起始模板</h1>
          <p class="text-gray-600 mb-4">这是一个使用原生HTML和TailwindCSS构建的简单页面，可以作为您项目的起点。</p>
          <div class="mt-6 flex space-x-2">
            <button class="bg-indigo-600 hover:bg-indigo-700 text-white py-2 px-4 rounded-md">
              开始使用
            </button>
            <button class="bg-white border border-gray-300 text-gray-700 py-2 px-4 rounded-md">
              查看文档
            </button>
          </div>
        </div>
      </main>
      <footer class="text-center mt-8 text-sm text-gray-500">
        请在下方输入提示词，AI将为您生成自定义页面
      </footer>
    </body>
  </html>`
    },
    vue3: {
      name: "Vue 3",
      description: "Vue 3 框架，对模型能力要求较高，可能会出现生成代码无法执行的情况。",
      systemPrompt: `ONLY USE VUE 3 WITH HTML, CSS AND JAVASCRIPT. Create a Vue 3 application using the CDN version (${CDN_URLS.VUE}). Structure your code with Vue 3 components, reactivity, and proper Vue syntax. Please write clear and helpful comments in your code to explain the structure and functionality. Use as much as you can TailwindCSS for the CSS, if you can't do something with TailwindCSS, then use custom CSS (make sure to import <script src="${CDN_URLS.TAILWIND}"></script> in the head). Also, try to elaborate as much as you can, to create something unique. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`,
      html: `<!DOCTYPE html>
  <html>
    <head>
      <title>Vue 3 演示</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="utf-8">
      <script src="${CDN_URLS.VUE}"></script>
      <script src="${CDN_URLS.TAILWIND}"></script>
      <style>
        [v-cloak] { display: none; }
      </style>
    </head>
    <body class="bg-gray-50">
      <div id="app" v-cloak class="min-h-screen p-4">
        <!-- Vue 3 应用容器 -->
        <div class="max-w-md mx-auto bg-white rounded-xl shadow-md overflow-hidden mt-10">
          <div class="p-6">
            <div class="flex justify-between items-center mb-4">
              <div class="text-emerald-600 font-medium">Vue 3 框架</div>
              <span class="text-xs px-2 py-1 rounded-full" :class="counterStyle">{{ status }}</span>
            </div>
            
            <h1 class="text-2xl font-bold text-gray-800 mb-2">Vue 3 响应式演示</h1>
            <p class="text-gray-600 mb-4">这个简单页面展示了Vue 3的响应式功能。</p>
            
            <div class="mt-4 bg-gray-50 p-4 rounded-lg">
              <div class="mb-2 font-medium">计数器: {{ counter }}</div>
              <div class="flex space-x-2">
                <button @click="increment" class="bg-emerald-500 hover:bg-emerald-600 text-white py-1 px-3 rounded">
                  增加
                </button>
                <button @click="decrement" class="bg-gray-500 hover:bg-gray-600 text-white py-1 px-3 rounded">
                  减少
                </button>
                <button @click="reset" class="border border-gray-300 text-gray-700 py-1 px-3 rounded">
                  重置
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <footer class="text-center mt-8 text-sm text-gray-500">
          请在下方输入提示词，AI将为您生成自定义Vue 3应用
        </footer>
      </div>
  
      <script>
        const { createApp, ref, computed } = Vue;
        
        createApp({
          setup() {
            // 响应式状态
            const counter = ref(0);
            
            // 计算属性
            const status = computed(() => {
              if (counter.value > 5) return '高';
              if (counter.value > 0) return '中';
              return '低';
            });
            
            const counterStyle = computed(() => {
              if (counter.value > 5) return 'bg-red-100 text-red-800';
              if (counter.value > 0) return 'bg-yellow-100 text-yellow-800';
              return 'bg-gray-100 text-gray-800';
            });
            
            // 方法
            const increment = () => counter.value++;
            const decrement = () => counter.value = Math.max(0, counter.value - 1);
            const reset = () => counter.value = 0;
            
            return {
              counter,
              status,
              counterStyle,
              increment,
              decrement,
              reset
            };
          }
        }).mount('#app');
      </script>
    </body>
  </html>`
    },
    elementPlus: {
      name: "Vue 3 + Element Plus",
      description: "Vue 3 框架配合 Element Plus 组件库",
      systemPrompt: `CREATE A VUE 3 APPLICATION WITH ELEMENT PLUS UI LIBRARY. Use Vue 3 CDN (${CDN_URLS.VUE}), Element Plus CDN (CSS: ${CDN_URLS.ELEMENT_PLUS_CSS}, JS: ${CDN_URLS.ELEMENT_PLUS_JS}), and Element Plus Icons (${CDN_URLS.ELEMENT_PLUS_ICONS}). 

When using Element Plus Icons, make sure to:
1. Import them from the global ElementPlusIconsVue object: const { Icon1, Icon2 } = ElementPlusIconsVue;
2. Register them in the components option: components: { Icon1, Icon2 }
3. Use them in templates: <el-icon><Icon1 /></el-icon>

Structure your code with Vue 3 components, reactivity, Element Plus components, and proper Vue syntax. Please write clear and helpful comments in your code to explain the structure and functionality. Follow Element Plus documentation for component usage. Try to elaborate as much as you can, to create something unique and visually appealing. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`,
      html: `<!DOCTYPE html>
<html>
  <head>
    <title>Element Plus 演示</title>
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta charset="utf-8">
    <link rel="stylesheet" href="${CDN_URLS.ELEMENT_PLUS_CSS}">
    <script src="${CDN_URLS.VUE}"></script>
    <script src="${CDN_URLS.ELEMENT_PLUS_JS}"></script>
    <script src="${CDN_URLS.ELEMENT_PLUS_ICONS}"></script>
    <style>
      [v-cloak] { display: none; }
      body { background-color: #f5f7fa; }
    </style>
  </head>
  <body>
    <div id="app" v-cloak>
      <el-config-provider>
        <div class="container" style="max-width: 800px; margin: 40px auto; padding: 0 20px;">
          <!-- Element Plus 标题和组件展示 -->
          <el-card shadow="hover" class="mb-4">
            <template #header>
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <span style="font-weight: bold;">Element Plus 组件库</span>
                <el-tag type="success">v2.9.7</el-tag>
              </div>
            </template>
            
            <p style="margin-bottom: 20px;">本模板演示了Element Plus常用组件，您可以基于此模板创建优雅的Web应用。</p>
            
            <el-divider content-position="left">表单组件展示</el-divider>
            
            <el-form :model="form" label-position="top" style="max-width: 460px; margin: 0 auto;">
              <el-form-item label="姓名">
                <el-input v-model="form.name" placeholder="请输入姓名">
                  <template #prefix>
                    <el-icon><User /></el-icon>
                  </template>
                </el-input>
              </el-form-item>
              
              <el-form-item label="选择类型">
                <el-select v-model="form.type" placeholder="请选择" style="width: 100%;">
                  <el-option label="选项一" value="1"></el-option>
                  <el-option label="选项二" value="2"></el-option>
                  <el-option label="选项三" value="3"></el-option>
                </el-select>
              </el-form-item>
              
              <el-form-item label="开关">
                <el-switch v-model="form.active"></el-switch>
              </el-form-item>
              
              <el-form-item label="重要程度">
                <el-rate v-model="form.rate"></el-rate>
              </el-form-item>
              
              <el-form-item>
                <el-button type="primary" @click="submitForm">
                  <el-icon><Check /></el-icon> 提交
                </el-button>
                <el-button @click="resetForm">
                  <el-icon><Refresh /></el-icon> 重置
                </el-button>
              </el-form-item>
            </el-form>
          </el-card>
          
          <div style="text-align: center; margin-top: 30px; color: #909399; font-size: 14px;">
            请在下方输入提示词，AI将为您生成自定义Element Plus应用
          </div>
        </div>
      </el-config-provider>
    </div>

    <script>
      const { createApp, ref, reactive } = Vue;
      
      // 导入Element Plus图标
      const { 
        User, 
        Check, 
        Refresh
      } = ElementPlusIconsVue;
      
      const App = {
        setup() {
          // 表单数据
          const form = reactive({
            name: '',
            type: '',
            active: false,
            rate: 3
          });
          
          // 表单方法
          const submitForm = () => {
            ElMessage.success('表单提交成功！');
            console.log('表单数据:', form);
          };
          
          const resetForm = () => {
            form.name = '';
            form.type = '';
            form.active = false;
            form.rate = 3;
            ElMessage.info('表单已重置');
          };
          
          return {
            form,
            submitForm,
            resetForm
          };
        },
        components: {
          User,
          Check,
          Refresh
        }
      };
      
      const app = createApp(App);
      app.use(ElementPlus);
      app.mount('#app');
    </script>
  </body>
</html>`
    },
    naiveUI: {
      name: "Vue 3 + Naive UI",
      description: "Vue 3 框架配合 Naive UI 组件库",
      systemPrompt: `CREATE A VUE 3 APPLICATION WITH NAIVE UI LIBRARY. Use Vue 3 CDN (${CDN_URLS.VUE}) and Naive UI CDN (${CDN_URLS.NAIVE_UI}). Structure your code with Vue 3 components, reactivity, Naive UI components, and proper Vue syntax. Please write clear and helpful comments in your code to explain the structure and functionality. Follow Naive UI documentation for component usage. Try to elaborate as much as you can, to create something unique and visually appealing. ALWAYS GIVE THE RESPONSE INTO A SINGLE HTML FILE`,
      html: `<!DOCTYPE html>
  <html>
    <head>
      <title>Naive UI 演示</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <meta charset="utf-8">
      <script src="${CDN_URLS.VUE}"></script>
      <script src="${CDN_URLS.NAIVE_UI}"></script>
      <style>
        [v-cloak] { display: none; }
        body { margin: 0; background-color: #f7f9fb; }
        .n-layout-header { box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
      </style>
    </head>
    <body>
      <div id="app" v-cloak>
        <n-config-provider>
          <n-layout>
            <!-- Naive UI 头部导航 -->
            <n-layout-header bordered style="padding: 12px 24px; height: 60px;">
              <n-space justify="space-between">
                <div style="display: flex; align-items: center;">
                  <n-gradient-text gradient="linear-gradient(90deg, #6366f1 0%, #8b5cf6 100%)" size="24">
                    Naive UI
                  </n-gradient-text>
                </div>
                <n-space>
                  <n-button quaternary circle>
                    <template #icon><n-icon><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 4a4 4 0 0 1 4 4a4 4 0 0 1-4 4a4 4 0 0 1-4-4a4 4 0 0 1 4-4m0 10c4.42 0 8 1.79 8 4v2H4v-2c0-2.21 3.58-4 8-4"></path></svg></n-icon></template>
                  </n-button>
                  <n-button quaternary circle>
                    <template #icon><n-icon><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="currentColor" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10s10-4.48 10-10S17.52 2 12 2m0 16.5c-.83 0-1.5-.67-1.5-1.5h3c0 .83-.67 1.5-1.5 1.5m5-2.5H7v-1l1-1v-2.61C8 9.27 9.03 7.47 11 7v-.5c0-.57.43-1 1-1s1 .43 1 1V7c1.97.47 3 2.28 3 4.39V14l1 1z"></path></svg></n-icon></template>
                  </n-button>
                </n-space>
              </n-space>
            </n-layout-header>
            
            <!-- 主要内容区域 -->
            <n-layout-content style="padding: 32px 24px;">
              <div style="max-width: 800px; margin: 0 auto;">
                <n-card title="Naive UI 组件展示" size="medium">
                  <n-space vertical size="large">
                    <div>
                      <n-alert type="info" title="关于本模板" style="margin-bottom: 20px;">
                        这是一个Naive UI组件库演示模板，展示了一些常用组件和功能。
                      </n-alert>
                      
                      <n-divider>主题切换</n-divider>
                      
                      <n-space align="center" justify="center" style="margin-bottom: 24px;">
                        <n-text>选择主题：</n-text>
                        <n-switch v-model:value="darkMode">
                          <template #checked>深色</template>
                          <template #unchecked>浅色</template>
                        </n-switch>
                      </n-space>
                      
                      <n-divider>数据输入</n-divider>
                      
                      <n-form label-placement="left" label-width="100">
                        <n-form-item label="任务名称">
                          <n-input v-model:value="taskName" placeholder="请输入任务名称" />
                        </n-form-item>
                        
                        <n-form-item label="优先级">
                          <n-slider v-model:value="priority" :step="1" :min="1" :max="5" :tooltip="false" />
                          <n-space style="margin-top: 6px;">
                            <n-tag v-for="n in 5" :key="n" :type="priority >= n ? 'success' : 'default'">
                              {{ n }}
                            </n-tag>
                          </n-space>
                        </n-form-item>
                        
                        <n-form-item label="截止日期">
                          <n-date-picker v-model:value="date" type="date" style="width: 100%;" />
                        </n-form-item>
                        
                        <n-space justify="end">
                          <n-button @click="resetForm">重置</n-button>
                          <n-button type="primary" @click="submitForm">提交</n-button>
                        </n-space>
                      </n-form>
                    </div>
                  </n-space>
                </n-card>
                
                <div style="text-align: center; margin-top: 32px; color: #8a9099; font-size: 14px;">
                  请在下方输入提示词，AI将为您生成自定义Naive UI应用
                </div>
              </div>
            </n-layout-content>
          </n-layout>
        </n-config-provider>
      </div>
  
      <script>
        const { createApp, ref, reactive, computed } = Vue;
        
        const App = {
          setup() {
            // 主题切换
            const darkMode = ref(false);
            
            // 表单数据
            const taskName = ref('');
            const priority = ref(3);
            const date = ref(Date.now());
            
            // 表单方法
            const resetForm = () => {
              taskName.value = '';
              priority.value = 3;
              date.value = Date.now();
              window.$message.info('表单已重置');
            };
            
            const submitForm = () => {
              if (!taskName.value) {
                window.$message.error('请输入任务名称');
                return;
              }
              window.$message.success('表单提交成功');
              console.log('表单数据:', {
                taskName: taskName.value,
                priority: priority.value,
                date: date.value
              });
            };
            
            return {
              darkMode,
              taskName,
              priority,
              date,
              resetForm,
              submitForm
            };
          }
        };
        
        const app = createApp(App);
        app.use(naive);
        app.mount('#app');
      </script>
    </body>
  </html>`
    },
    // Gradio Server (Python) template — produces a single Python file that
    // exposes functions as Gradio API endpoints via gradio.Server (Gradio 6+).
    // The runner in utils/gradioRunner.js spawns this with share=True and
    // mcp_server=True, capturing the local URL + share URL + MCP endpoint.
    "gradio-server": {
      name: "Gradio Server (Python)",
      description:
        "Generate a Python Gradio 6+ Server file that exposes functions as HTTP API endpoints, with a public share URL and optional MCP tool exposure. Output is a single .py file, NOT HTML.",
      systemPrompt: `You are an expert Python Gradio 6+ developer. Produce a SINGLE self-contained Python file using gradio.Server (Gradio 6+) that exposes the user's requested functionality as HTTP API endpoints.

Use the official API:

    import gradio as gr
    server = gr.Server()

    @server.api
    def add(a: int, b: int) -> int:
        \"\"\"Add two numbers.\"\"\"
        return a + b

    @server.api(name="greet", description="Greet a user", concurrency_limit=10, time_limit=30)
    def greet(name: str, greeting: str = "Hello") -> str:
        return f"{greeting}, {name}!"

    if __name__ == "__main__":
        server.launch(share=True, mcp_server=True, server_name="127.0.0.1", server_port=7860, prevent_thread_lock=False)

Rules:
- Output ONLY the Python file, no markdown fences, no explanation.
- Use type hints on every function (Gradio uses them to build the OpenAPI schema).
- Each function gets a short docstring (1-2 lines) — it becomes the API description.
- Use @server.api decorator. Pass name/description/concurrency_limit/time_limit when useful.
- Add a launch() call at the bottom with share=True, mcp_server=True, server_name="127.0.0.1", server_port=7860.
- Use only the Python standard library + gradio. If a third-party package is essential, add a comment like '# pip install numpy' at the top.
- Implement enough endpoints to fulfill the user's request with good coverage (5+ endpoints when natural).
- Keep each endpoint small and focused. Do not include long-running or blocking work that would tie up the queue.
- For streaming endpoints, use 'yield' inside the function (Gradio's queue + SSE handles it).`,
      html: `import gradio as gr

server = gr.Server()

@server.api
def add(a: int, b: int) -> int:
    \"\"\"Add two integers.\"\"\"
    return a + b

@server.api
def subtract(a: int, b: int) -> int:
    \"\"\"Subtract b from a.\"\"\"
    return a - b

@server.api
def multiply(a: float, b: float) -> float:
    \"\"\"Multiply two numbers.\"\"\"
    return a * b

@server.api
def greet(name: str, greeting: str = "Hello") -> str:
    \"\"\"Greet someone with a custom greeting.\"\"\"
    return f"{greeting}, {name}!"

@server.api
def count_words(text: str) -> dict:
    \"\"\"Return word count, char count, and line count of the input text.\"\"\"
    words = text.split()
    return {
        "words": len(words),
        "chars": len(text),
        "lines": text.count("\\n") + 1 if text else 0,
    }

if __name__ == "__main__":
    server.launch(
        share=True,
        mcp_server=True,
        server_name="127.0.0.1",
        server_port=7860,
    )
`,
    }
  };
  
  export { TEMPLATES, CDN_URLS };