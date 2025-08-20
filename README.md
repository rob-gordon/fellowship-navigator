# Fellowship Navigator 🧭

> **Your AI-powered companion for discovering concrete fellowship project ideas**

Fellowship Navigator is an interactive tool designed specifically for participants in the AI+Epistemics Fellowship. It helps you move from vague interests to concrete, actionable project ideas through a guided exploration of five key project dimensions.

## 🎯 What This Tool Does

Instead of overwhelming you with complexity, Fellowship Navigator breaks down project planning into manageable pieces:

- **🎭 Hair-on-Fire Problem**: Identifies urgent global information/communication challenges
- **🧠 Epistemic Goal**: Clarifies what reasoning improvement your project aims to achieve
- **👥 Target User**: Defines who will benefit from your project
- **⚙️ Technical Shape**: Determines what form your project will take
- **📡 Signal Gathering**: Plans how to find users and validate demand

The tool uses AI to search through fellowship discussions and generate personalized options based on your responses, helping you discover project ideas you might not have considered.

## 🚀 Getting Started

### Prerequisites

- [Bun](https://bun.sh/) (recommended) or Node.js 18+
- Access to the fellowship environment (Slack, documents, etc.)

### Installation

1. **Clone this repository**

   ```bash
   git clone [repository-url]
   cd fellowship-navigator
   ```

2. **Install dependencies**

   ```bash
   bun install
   ```

3. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your API keys and fellowship credentials
   ```

4. **Run the tool**
   ```bash
   bun run dev
   ```

### Running with Context

You can also start with a specific context file:

```bash
bun run dev path/to/your/context.txt
```

## 🎮 How to Use

1. **Start the conversation**: The tool will ask about your general interests in AI and epistemology
2. **Explore dimensions**: Work through each project dimension one at a time
3. **Refine options**: If you don't like the suggested options, ask for different ones
4. **Discover projects**: Get concrete, personalized project ideas based on your preferences
5. **Take action**: Use the generated ideas to start prototyping and testing demand

## 🔧 Technical Details

- **Built with**: TypeScript, Bun, AI SDK, Clack prompts
- **AI Models**: OpenAI GPT-4, Google Gemini Flash
- **Search**: Integrates with fellowship content (Slack, documents)
- **Architecture**: Modular design with clear separation of concerns

## 🤝 Contributing

This tool is designed for the fellowship community. If you have ideas for improvements or find bugs:

1. Check existing issues first
2. Create a new issue with clear description
3. Submit a pull request with your changes

## 📚 Fellowship Context

This tool is specifically designed for the AI+Epistemics Fellowship, which supports:

- **AI tools that enhance human reasoning** and decision-making
- **Raising epistemic ceilings** (deeper expert insight) and **floors** (broader population clarity)
- **Supporting mediation, negotiation, and collective action**
- **Addressing urgent global information challenges**

## 🆘 Need Help?

- Check the fellowship Slack channels for support
- Review the code comments for technical details
- Ask your fellowship mentors for guidance on using the generated project ideas

---

_Ready to discover your next world-changing project? Let's navigate the possibilities together! 🌍✨_
