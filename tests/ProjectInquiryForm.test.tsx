import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import emailjs from '@emailjs/browser';
import ProjectInquiryForm from '../components/ProjectInquiryForm';
import { EMAILJS_NOTIFY_TEMPLATE_ID, EMAILJS_AUTOREPLY_TEMPLATE_ID } from '../data/emailConfig';

vi.mock('@emailjs/browser', () => ({
  default: { send: vi.fn() },
}));

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

beforeEach(() => {
  now = 0;
  vi.spyOn(Date, 'now').mockImplementation(() => now);
  localStorage.clear();
  vi.mocked(emailjs.send).mockReset();
  vi.mocked(emailjs.send).mockResolvedValue({ status: 200, text: 'OK' } as any);
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('ProjectInquiryForm reliability', () => {
  it('shows success only after the owner notification succeeds', async () => {
    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/inquiry received/i)).toBeInTheDocument());
  });

  it('shows an error and no success when the owner notification fails', async () => {
    vi.mocked(emailjs.send).mockRejectedValueOnce(new Error('network failure'));

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
    vi.mocked(emailjs.send).mockRejectedValueOnce(new Error('network failure'));

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

  it('rejects a honeypot-filled submission without sending email', async () => {
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
    expect(emailjs.send).not.toHaveBeenCalled();
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
    expect(emailjs.send).not.toHaveBeenCalled();
    expect(screen.queryByText(/inquiry received/i)).not.toBeInTheDocument();
  });

  it('prevents duplicate submissions while a request is processing', async () => {
    vi.mocked(emailjs.send).mockImplementation(() => new Promise(() => {}));

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

    expect(emailjs.send).toHaveBeenCalledTimes(1);
  });

  it('reports success even if the best-effort auto-reply fails', async () => {
    vi.mocked(emailjs.send)
      .mockResolvedValueOnce({ status: 200, text: 'OK' } as any)
      .mockRejectedValueOnce(new Error('autoreply failed'));

    render(
      <MemoryRouter>
        <ProjectInquiryForm />
      </MemoryRouter>,
    );

    now = 100000;
    await fillValidForm();
    fireEvent.click(screen.getByRole('button', { name: /send inquiry/i }));

    await waitFor(() => expect(screen.getByText(/inquiry received/i)).toBeInTheDocument());
    expect(emailjs.send).toHaveBeenCalledTimes(2);
    expect(vi.mocked(emailjs.send).mock.calls[1][1]).toBe(EMAILJS_AUTOREPLY_TEMPLATE_ID);
  });
});