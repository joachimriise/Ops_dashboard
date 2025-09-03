import React from 'react';
import { Layout } from 'react-grid-layout';

interface GridLayoutProps {
  children: React.ReactElement[];
  layouts: { [key: string]: Layout[] };
  onLayoutChange: (layout: Layout[], layouts: { [key: string]: Layout[] }) => void;
  isLocked: boolean;
  className?: string;
}

export default function GridLayout({
  children,
  layouts,
  onLayoutChange,
  isLocked,
  className = ""
}: GridLayoutProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [containerDimensions, setContainerDimensions] = React.useState({ width: 0, height: 0 });

  React.useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerDimensions({ width: rect.width, height: rect.height });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const convertLayoutToPixels = (layout: Layout[]) => {
    const viewportHeight = window.innerHeight;
    const availableHeight = viewportHeight - 80; // Header height
    const availableWidth = containerDimensions.width || window.innerWidth;

    return layout.map(item => ({
      ...item,
      pixelX: (item.x / 16) * availableWidth,
      pixelY: (item.y / 16) * availableHeight,
      pixelWidth: (item.w / 16) * availableWidth,
      pixelHeight: (item.h / 16) * availableHeight
    }));
  };

  const currentLayout = layouts.lg || [];
  const pixelLayout = convertLayoutToPixels(currentLayout);

  return (
    <div 
      ref={containerRef} 
      className={`relative w-full h-full overflow-hidden ${className}`}
      style={{ height: 'calc(100vh - 80px)' }}
    >
      {children.map((child, index) => {
        const layoutItem = pixelLayout[index];
        if (!layoutItem) return null;

        return (
          <div
            key={layoutItem.i}
            style={{
              position: 'absolute',
              left: `${layoutItem.pixelX}px`,
              top: `${layoutItem.pixelY}px`,
              width: `${layoutItem.pixelWidth}px`,
              height: `${layoutItem.pixelHeight}px`,
              padding: '4px'
            }}
          >
            {child}
          </div>
        );
      })}
    </div>
  );
}