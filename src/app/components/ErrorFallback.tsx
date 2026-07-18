import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorFallback extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error) {
    console.error("[ErrorBoundary]", error);
  }

  handleReset = () => {
    this.setState({ error: null });
  };

  render() {
    if (this.state.error) {
      return (
        <div
          className="min-h-screen flex items-center justify-center p-6"
          style={{ background: "linear-gradient(160deg,#3B1F6B,#5B21B6,#7C3AED)" }}
        >
          <div className="text-center max-w-sm">
            <div className="text-6xl mb-4">🔧</div>
            <h1 className="text-white font-black text-2xl mb-2">Ой! Что-то сломалось</h1>
            <p className="text-purple-200 text-sm mb-6">
              Кот-учёный уже чинит поломку! Нажми кнопку, чтобы продолжить.
            </p>
            <button
              onClick={this.handleReset}
              className="bg-white text-purple-700 font-black px-6 py-3 rounded-2xl shadow-xl hover:scale-105 transition-transform"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
