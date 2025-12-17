import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Keep console logging for debugging in dev/prod
    // eslint-disable-next-line no-console
    console.error('Uncaught UI error:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      const message = this.state.error?.message || 'Erro inesperado';
      return (
        <div className="min-h-screen bg-gradient-to-br from-[#1A1512] to-[#2D2420] p-6 flex items-center justify-center">
          <div className="w-full max-w-md bg-[#2A2018] border border-[#3E352F] rounded-2xl p-6 text-center">
            <span className="text-4xl mb-4 block">❌</span>
            <h2 className="text-xl font-bold text-[#F5F5F0] mb-2">O app encontrou um erro</h2>
            <p className="text-[#8B7355] mb-6 break-words">{message}</p>
            <button
              onClick={this.handleReload}
              className="px-6 py-3 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-[#B8962E] transition-colors"
            >
              Recarregar
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
