import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TemplateCard } from '../template-card';

const mockTemplate = {
  id: 'tpl-001',
  name: 'Classic Tournament',
  category: 'tournament',
  thumbnailUrl: '/templates/classic.png',
};

describe('TemplateCard', () => {
  it('renders template name', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    expect(screen.getByText('Classic Tournament')).toBeInTheDocument();
  });

  it('renders template thumbnail with alt text', () => {
    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={vi.fn()}
      />
    );

    const img = screen.getByRole('img', { name: 'Classic Tournament' });
    expect(img).toBeInTheDocument();
  });

  it('calls onSelect when clicked', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();

    render(
      <TemplateCard
        template={mockTemplate}
        isSelected={false}
        onSelect={onSelect}
      />
    );

    await user.click(screen.getByRole('button'));
    expect(onSelect).toHaveBeenCalledWith('tpl-001');
  });
});
