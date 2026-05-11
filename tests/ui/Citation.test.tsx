import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { Citation } from '@/components/ui/Citation'

describe('<Citation>', () => {
  it('renders a link to the source URL with publisher as visible text', () => {
    render(
      <Citation
        source={{
          id: 's1',
          title: { zh: '标题', en: 'Title' },
          publisher: 'Unicode Consortium',
          url: 'https://unicode.org',
          accessed: '2026-05-11',
        }}
        locale="en"
      />
    )
    const link = screen.getByRole('link', { name: /Unicode Consortium/ })
    expect(link).toHaveAttribute('href', 'https://unicode.org')
    expect(link).toHaveAttribute('target', '_blank')
    expect(link.getAttribute('rel')).toMatch(/noopener/)
  })
})
