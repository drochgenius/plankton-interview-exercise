import { render } from '@testing-library/react';
import { MathText } from './MathText';

describe('MathText', () => {
  it('shows plain text as it is', () => {
    const { container } = render(<MathText text="Pick the larger number." />);
    expect(container).toHaveTextContent('Pick the larger number.');
    expect(container.querySelector('.katex')).toBeNull();
  });

  it('renders inline math with KaTeX and keeps the surrounding text', () => {
    const { container } = render(<MathText text="What is $7 \times 8$?" />);
    expect(container.querySelector('.katex')).not.toBeNull();
    expect(container).toHaveTextContent('What is');
    expect(container).toHaveTextContent('?');
    expect(container).not.toHaveTextContent('$');
  });

  it('renders several math parts', () => {
    const { container } = render(
      <MathText text="Which is larger, $\frac{1}{2}$ or $\frac{1}{4}$?" />,
    );
    expect(container.querySelectorAll('.katex')).toHaveLength(2);
  });

  it('does not throw on invalid LaTeX and shows it as an error', () => {
    const { container } = render(<MathText text="Oops $\frac{1$ here" />);
    expect(container.querySelector('.katex-error')).not.toBeNull();
    expect(container).toHaveTextContent('here');
  });
});
