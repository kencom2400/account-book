import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from '../Card';

describe('Card', () => {
  it('should render card with children', () => {
    render(<Card>Card Content</Card>);
    expect(screen.getByText('Card Content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const { container } = render(<Card className="custom-class">Content</Card>);
    expect(container.firstChild).toHaveClass('custom-class');
  });

  it('should render CardHeader', () => {
    render(
      <Card>
        <CardHeader>Header</CardHeader>
      </Card>
    );
    expect(screen.getByText('Header')).toBeInTheDocument();
  });

  it('should render CardTitle', () => {
    render(
      <Card>
        <CardTitle>Title</CardTitle>
      </Card>
    );
    const title = screen.getByText('Title');
    expect(title).toBeInTheDocument();
    expect(title.tagName).toBe('H2');
  });

  it('should render CardContent', () => {
    render(
      <Card>
        <CardContent>Content</CardContent>
      </Card>
    );
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('should render CardDescription', () => {
    render(
      <Card>
        <CardDescription>Description</CardDescription>
      </Card>
    );
    const description = screen.getByText('Description');
    expect(description).toBeInTheDocument();
    expect(description.tagName).toBe('P');
  });

  it('should render CardFooter', () => {
    render(
      <Card>
        <CardFooter>Footer</CardFooter>
      </Card>
    );
    expect(screen.getByText('Footer')).toBeInTheDocument();
  });

  it('should render complete card structure', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription>Card Description</CardDescription>
          <p>Card Body</p>
        </CardContent>
        <CardFooter>Card Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Card Title')).toBeInTheDocument();
    expect(screen.getByText('Card Description')).toBeInTheDocument();
    expect(screen.getByText('Card Body')).toBeInTheDocument();
    expect(screen.getByText('Card Footer')).toBeInTheDocument();
  });

  it('should apply custom className to CardHeader', () => {
    const { container } = render(
      <Card>
        <CardHeader className="custom-header">Header</CardHeader>
      </Card>
    );
    expect(container.querySelector('.custom-header')).toBeInTheDocument();
  });

  it('should apply custom className to CardTitle', () => {
    const { container } = render(
      <Card>
        <CardTitle className="custom-title">Title</CardTitle>
      </Card>
    );
    expect(container.querySelector('.custom-title')).toBeInTheDocument();
  });

  it('should apply custom className to CardContent', () => {
    const { container } = render(
      <Card>
        <CardContent className="custom-content">Content</CardContent>
      </Card>
    );
    expect(container.querySelector('.custom-content')).toBeInTheDocument();
  });

  it('should apply custom className to CardDescription', () => {
    const { container } = render(
      <Card>
        <CardDescription className="custom-description">Description</CardDescription>
      </Card>
    );
    expect(container.querySelector('.custom-description')).toBeInTheDocument();
  });

  it('should apply custom className to CardFooter', () => {
    const { container } = render(
      <Card>
        <CardFooter className="custom-footer">Footer</CardFooter>
      </Card>
    );
    expect(container.querySelector('.custom-footer')).toBeInTheDocument();
  });
});
