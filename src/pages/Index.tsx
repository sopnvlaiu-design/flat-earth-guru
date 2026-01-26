import { Header } from "@/components/Header";
import { ChatInterface } from "@/components/ChatInterface";
import { DomeVisual } from "@/components/DomeVisual";

const Index = () => {
  return (
    <div className="min-h-screen flex flex-col relative">
      <DomeVisual />
      <div className="relative z-10 flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 flex flex-col">
          <ChatInterface />
        </main>
      </div>
    </div>
  );
};

export default Index;
