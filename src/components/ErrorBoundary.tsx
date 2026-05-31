import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: unknown) {
    // eslint-disable-next-line no-console
    console.error("App error boundary:", error, info);
  }

  handleReload = () => {
    // Limpia caché del SW si existiera
    if ("caches" in window) {
      caches.keys().then((keys) => keys.forEach((k) => caches.delete(k)));
    }
    window.location.reload();
  };

  handleOpenExternal = () => {
    const url = window.location.href;
    const isAndroid = /Android/i.test(navigator.userAgent);
    if (isAndroid) {
      const stripped = url.replace(/^https?:\/\//, "");
      window.location.href = `intent://${stripped}#Intent;scheme=https;package=com.android.chrome;end`;
    } else {
      window.open(url, "_blank");
    }
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full text-center space-y-4">
          <h1 className="text-2xl font-bold text-primary">Algo ha fallado al cargar</h1>
          <p className="text-sm text-muted-foreground">
            Si estás dentro de la aplicación de Facebook o Instagram, ábrelo en tu navegador
            (Chrome o Safari) para una mejor experiencia.
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={this.handleReload}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-md font-medium"
            >
              Reintentar
            </button>
            <button
              onClick={this.handleOpenExternal}
              className="bg-secondary text-secondary-foreground px-4 py-2 rounded-md font-medium"
            >
              Abrir en el navegador
            </button>
          </div>
        </div>
      </div>
    );
  }
}
