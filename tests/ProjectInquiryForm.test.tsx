import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ProjectInquiryForm from '../components/ProjectInquiryForm';

const fetchMock = vi.fn();
global.fetch = fetchMock as any;

const VALID_SERVICE = 'Websites & Landing Pages';
const VALID_DESCRIPTION = 'A'.repeat(20);

let now = 0;

function fillStepOne() {
  fireEvent.change(screen.getByLabelText(/service required/i), { target: { value: VALID_SERVICE } });
  fireEvent.change(screen.getByLabelText(/project description/i), { target: { value: VALID_DESCRIPTION } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
}

function fillStepTwo() {
  fireEvent.change(screen.getByLabelText(/estimated budget/i), { target: { value: 'Under KSh 20,000' } });
  fireEvent.change(screen.getByLabelText(/expected timeline/i), { target: { value: 'As soon as possible' } });
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
}

function fillStepThree() {
  fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
}

async function fillValidForm() {
  fillStepOne();
  fillStepTwo();
  fillStepThree();
}

function jsonResponse(body: unknown, ok = true, status = ok ? 201 : 400) {
  return {
    ok,
    status,
    json: async () => body,
  } as Response;
}

beforeEach(() => {
  now = 0;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  localStorage.clear();
  fetchMock.mockReset();
  fetchMock.mockResolvedValue(jsonResponse({
    inquiry: { id: 'inq-1', status: 'new' },
    notification: { owner: { status: 'sent' }, client: { status: 'sent' } },
  }));
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ProjectInquiryForm reliability', () => {
  it('shows success after the inquiry is persisted', async () => {
    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/inquiry received/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalled();
    const request = fetchMock.mock.calls[0];
    expect(request[0]).toContain('/inquiries');
  });

  it('shows an error when persistence fails', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network failure'));

    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/didn't go through/i)).toBeInTheDocument());
    expect(screen.queryByText(/inquiry received/i)).not.toBeInTheDocument();
  });

  it('preserves entered data after a delivery failure', async () => {
    fetchMock.mockRejectedValueOnce(new Error('network failure'));

    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/didn't go through/i)).toBeInTheDocument());
    expect(screen.getByLabelText(/full name/i)).toHaveValue('Test User');
    expect(screen.getByLabelText(/email address/i)).toHaveValue('test@example.com');
  });

  it('rejects a honeypot-filled submission without calling the backend', async () => {
    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    const honeypot = document.querySelector('input[name="company_site"]') as HTMLInputElement;
    fireEvent.change(honeypot, { target: { value: 'spam' } });
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/could not be submitted/i)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/inquiry received/i)).not.toBeInTheDocument();
  });

  it('rejects a submission made too quickly with understandable feedback', async () => {
    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/take a moment to review/i)).toBeInTheDocument());
    expect(fetchMock).not.toHaveBeenCalled();
    expect(screen.queryByText(/inquiry received/i)).not.toBeInTheDocument();
  });

  it('prevents duplicate submissions while a request is processing', async () => {
    fetchMock.mockImplementation(() => new Promise(() => {}));

    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    const form = screen.getByRole('form', { name: /project inquiry/i });
    fireEvent.submit(form);

    await waitFor(() => expect(screen.getByText(/sending/i)).toBeInTheDocument());
    fireEvent.submit(form);

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('reports success even if notification delivery fails after persistence', async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({
      inquiry: { id: 'inq-1', status: 'new' },
      notification: { owner: { status: 'failed', error: 'EmailJS unavailable' }, client: { status: 'skipped' } },
    }));

    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/inquiry received/i)).toBeInTheDocument());
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});