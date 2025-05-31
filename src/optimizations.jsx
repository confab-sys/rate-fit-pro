// Performance Optimization Utilities

// 1. Image Lazy Loading Component
import { LazyLoadImage } from 'react-lazy-load-image-component';
import 'react-lazy-load-image-component/src/effects/blur.css';

export const OptimizedImage = ({ src, alt, className }) => (
  <LazyLoadImage
    src={src}
    alt={alt}
    className={className}
    effect="blur"
    placeholderSrc={src} // Low quality image placeholder
  />
);

// 2. Virtualized List Component
import { FixedSizeList } from 'react-window';

export const VirtualizedList = ({ items, height, itemSize, renderItem }) => (
  <FixedSizeList
    height={height}
    width="100%"
    itemCount={items.length}
    itemSize={itemSize}
  >
    {({ index, style }) => (
      <div style={style}>
        {renderItem(items[index])}
      </div>
    )}
  </FixedSizeList>
);

// 3. Code Splitting Example
export const lazyLoadComponent = (importFunc) => {
  const Component = React.lazy(importFunc);
  return (props) => (
    <React.Suspense fallback={<div>Loading...</div>}>
      <Component {...props} />
    </React.Suspense>
  );
};

// 4. Memoization Example
export const memoizedComponent = (Component) => {
  return React.memo(Component, (prevProps, nextProps) => {
    // Custom comparison function
    return JSON.stringify(prevProps) === JSON.stringify(nextProps);
  });
};

// 5. Data Fetching with React Query
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      cacheTime: 10 * 60 * 1000, // 10 minutes
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const QueryProvider = ({ children }) => (
  <QueryClientProvider client={queryClient}>
    {children}
  </QueryClientProvider>
);

// Example usage of optimized data fetching
export const useOptimizedData = (queryKey, fetchFn) => {
  return useQuery({
    queryKey: [queryKey],
    queryFn: fetchFn,
    staleTime: 5 * 60 * 1000,
    cacheTime: 10 * 60 * 1000,
  });
}; 