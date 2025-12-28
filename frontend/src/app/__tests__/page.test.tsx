import { render, screen } from '@testing-library/react';
import Home from '../page';

// Mock framer-motion to avoid animation issues in tests
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  useScroll: () => ({ scrollY: { get: () => 0 } }),
  useTransform: () => ({ get: () => 0 }),
  useInView: () => true,
}));

describe('Enhanced Homepage', () => {
  it('renders the hero section with brand name', () => {
    render(<Home />);
    
    expect(screen.getByText('Arba Delivery')).toBeInTheDocument();
    expect(screen.getByText(/Experience the future of delivery/)).toBeInTheDocument();
  });

  it('renders feature highlights', () => {
    render(<Home />);
    
    expect(screen.getByText('30min delivery')).toBeInTheDocument();
    expect(screen.getByText('100% secure')).toBeInTheDocument();
    expect(screen.getByText('5-star rated')).toBeInTheDocument();
  });

  it('renders CTA buttons', () => {
    render(<Home />);
    
    expect(screen.getByText('Start Ordering')).toBeInTheDocument();
    expect(screen.getByText('Become a Courier')).toBeInTheDocument();
  });

  it('renders features section', () => {
    render(<Home />);
    
    expect(screen.getByText('Why Choose Mohamedo?')).toBeInTheDocument();
    expect(screen.getByText('Fast Delivery')).toBeInTheDocument();
    expect(screen.getByText('Real-time Tracking')).toBeInTheDocument();
    expect(screen.getByText('Secure & Safe')).toBeInTheDocument();
    expect(screen.getByText('Professional Network')).toBeInTheDocument();
  });

  it('renders stats section', () => {
    render(<Home />);
    
    expect(screen.getByText('Trusted by Thousands')).toBeInTheDocument();
    expect(screen.getByText('50K+')).toBeInTheDocument();
    expect(screen.getByText('Happy Customers')).toBeInTheDocument();
  });

  it('renders CTA section', () => {
    render(<Home />);
    
    expect(screen.getByText('Ready to Get Started?')).toBeInTheDocument();
    expect(screen.getByText('Get Started Now')).toBeInTheDocument();
  });
});