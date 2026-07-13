// @vitest-environment jsdom
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaverEstimator } from './widget.jsx';
import { resolveConfig } from './config.js';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// The photo step is optional — skip through it (no upload) to reach the contact gate.
async function skipPhoto(user) {
  expect(screen.getByText('See the transformation')).toBeDefined();
  await user.click(screen.getByRole('button', { name: /continue/i }));
}

describe('PaverEstimator — full wizard flow', () => {
  it('walks service → area → condition → photo → contact gate → estimate reveal', async () => {
    const user = userEvent.setup();
    render(<PaverEstimator config={resolveConfig({ businessName: 'Test Pavers' })} />);

    // Step 1 — service
    expect(screen.getByText('Get your instant paver estimate')).toBeDefined();
    await user.click(screen.getByText('Paver Sealing'));

    // Step 2 — area preset
    expect(screen.getByText('How big is the area?')).toBeDefined();
    await user.click(screen.getByText('2-Car Driveway'));

    // Step 3 — condition
    expect(screen.getByText('What condition are they in?')).toBeDefined();
    await user.click(screen.getByText('Faded / dull'));

    // Step 4 — photo (optional): skip
    await skipPhoto(user);

    // Step 5 — contact gate. Submitting while invalid surfaces errors but does NOT reveal.
    const submit = screen.getByRole('button', { name: /See my estimate/i });
    await user.click(submit);
    expect(screen.queryByText('$1,035')).toBeNull(); // no reveal
    expect(screen.getByText('Please enter your name.')).toBeDefined(); // error surfaced

    await user.type(screen.getByLabelText('Full name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Mobile phone'), '2395550142');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');

    // Valid fields but consent unchecked -> submit shows the consent error, still no reveal.
    await user.click(submit);
    expect(screen.queryByText('$1,035')).toBeNull();
    expect(screen.getByText(/check the box to agree/i)).toBeDefined();

    // Check consent -> submit -> reveal.
    await user.click(screen.getByRole('checkbox'));
    await user.click(submit);

    // Reveal — sealing $1.50–$3.00 × 600 × 1.15 (faded) = $1,035–$2,070
    expect(screen.getByText('$1,035')).toBeDefined();
    expect(screen.getByText('$2,070')).toBeDefined();
    expect(screen.getByText(/Text us photos of your pavers/i)).toBeDefined();
  });

  it('shows the consult line (not the photo line) for paver installation, via custom sqft', async () => {
    const user = userEvent.setup();
    render(<PaverEstimator config={resolveConfig()} />);

    await user.click(screen.getByText('Paver Installation'));
    await user.click(screen.getByText('Custom size'));

    // Custom input appears; enter 1000 sqft and continue
    await user.type(screen.getByLabelText(/square footage/i), '1000');
    await user.click(screen.getByRole('button', { name: /Continue/i }));

    await user.click(screen.getByText('Good'));
    await skipPhoto(user);

    await user.type(screen.getByLabelText('Full name'), 'Bob Vila');
    await user.type(screen.getByLabelText('Mobile phone'), '(239) 555-0142');
    await user.type(screen.getByLabelText('Email'), 'bob@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /See my estimate/i }));

    // install $12–$24 × 1000 = $12,000–$24,000
    expect(screen.getByText('$12,000')).toBeDefined();
    expect(screen.getByText('$24,000')).toBeDefined();
    expect(screen.getByText(/on-site design consult is required/i)).toBeDefined();
    expect(screen.queryByText(/Text us photos/i)).toBeNull();
    // Custom area label is not double-printed on the summary row.
    expect(screen.getByText('Custom size (1,000 sq ft)')).toBeDefined();
  });

  it('POSTs the full lead payload to the webhook on submit', async () => {
    const fetchMock = vi.fn(() => Promise.resolve({ ok: true }));
    vi.stubGlobal('fetch', fetchMock);

    const user = userEvent.setup();
    const config = resolveConfig({ webhookUrl: 'https://example.com/hook' });
    render(<PaverEstimator config={config} />);

    await user.click(screen.getByText('Pressure Washing'));
    await user.click(screen.getByText('Pool Deck')); // 800 sqft
    await user.click(screen.getByText('Heavy mold & stains'));
    await skipPhoto(user);

    await user.type(screen.getByLabelText('Full name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Mobile phone'), '2395550142');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /See my estimate/i }));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, opts] = fetchMock.mock.calls[0];
    expect(url).toBe('https://example.com/hook');
    const body = JSON.parse(opts.body);
    expect(body).toMatchObject({
      name: 'Jane Doe',
      phone: '2395550142',
      email: 'jane@example.com',
      smsConsent: true,
      service: 'pressureWashing',
      areaLabel: 'Pool Deck',
      sqft: 800,
      condition: 'heavy',
      photoProvided: false,
      source: 'paver-estimator',
    });
    // estimate + timestamp present
    expect(typeof body.estimateLow).toBe('number');
    expect(typeof body.estimateHigh).toBe('number');
    expect(body.estimateHigh).toBeGreaterThanOrEqual(body.estimateLow);
    expect(typeof body.timestamp).toBe('string');
  });

  it('still reveals the estimate when the webhook throws (graceful failure)', async () => {
    vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network down'))));
    vi.spyOn(console, 'error').mockImplementation(() => {});

    const user = userEvent.setup();
    render(<PaverEstimator config={resolveConfig({ webhookUrl: 'https://example.com/hook' })} />);

    await user.click(screen.getByText('Paver Sealing'));
    await user.click(screen.getByText('2-Car Driveway'));
    await user.click(screen.getByText('Good'));
    await skipPhoto(user);
    await user.type(screen.getByLabelText('Full name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Mobile phone'), '2395550142');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /See my estimate/i }));

    // Estimate shows despite the rejected webhook (sealing 600 good = $900–$1,800)
    expect(screen.getByText('$900')).toBeDefined();
    expect(screen.getByText('$1,800')).toBeDefined();
  });

  it('displays a labeled minimum-job price (not a $x–$x range) for tiny jobs', async () => {
    const user = userEvent.setup();
    render(<PaverEstimator config={resolveConfig()} />);

    await user.click(screen.getByText('Pressure Washing'));
    await user.click(screen.getByText('Custom size'));
    await user.type(screen.getByLabelText(/square footage/i), '100'); // $35–$80 → floored
    await user.click(screen.getByRole('button', { name: /Continue/i }));
    await user.click(screen.getByText('Good'));
    await skipPhoto(user);
    await user.type(screen.getByLabelText('Full name'), 'Jane Doe');
    await user.type(screen.getByLabelText('Mobile phone'), '2395550142');
    await user.type(screen.getByLabelText('Email'), 'jane@example.com');
    await user.click(screen.getByRole('checkbox'));
    await user.click(screen.getByRole('button', { name: /See my estimate/i }));

    expect(screen.getByText('$175')).toBeDefined();
    expect(screen.getByText('minimum job price')).toBeDefined();
  });

  it('shows a simulated before/after slider after a photo is uploaded (sealing)', async () => {
    // jsdom lacks createObjectURL — stub it for this test.
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:mock-photo';
    URL.revokeObjectURL = () => {};
    try {
      const user = userEvent.setup();
      render(<PaverEstimator config={resolveConfig()} />);

      await user.click(screen.getByText('Paver Sealing'));
      await user.click(screen.getByText('2-Car Driveway'));
      await user.click(screen.getByText('Good'));

      // On the photo step, upload a photo (fireEvent bypasses visibility checks on the hidden input)
      expect(screen.getByText('See the transformation')).toBeDefined();
      const file = new File(['x'], 'pavers.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText('Upload a photo of your pavers'), { target: { files: [file] } });

      // The before/after comparison renders, with the wet-look filter applied to
      // the "after" image and the reveal clip applied to the "before" image.
      const afterImg = screen.getByAltText('After sealing (simulated)');
      const beforeImg = screen.getByAltText('Before');
      expect(afterImg.style.filter).toContain('saturate'); // wet-look transform is wired
      expect(beforeImg.style.clipPath).toContain('inset'); // drag-to-reveal clip is wired
      expect(screen.getByLabelText('Slide to compare before and after')).toBeDefined();
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });

  it('shows a working before/after for paver installation too (new-paver look + consult note)', async () => {
    const origCreate = URL.createObjectURL;
    const origRevoke = URL.revokeObjectURL;
    URL.createObjectURL = () => 'blob:mock-photo';
    URL.revokeObjectURL = () => {};
    try {
      const user = userEvent.setup();
      render(<PaverEstimator config={resolveConfig()} />);

      await user.click(screen.getByText('Paver Installation'));
      await user.click(screen.getByText('2-Car Driveway'));
      await user.click(screen.getByText('Good'));

      expect(screen.getByText('See the transformation')).toBeDefined();
      const file = new File(['x'], 'yard.png', { type: 'image/png' });
      fireEvent.change(screen.getByLabelText('Upload a photo of your pavers'), { target: { files: [file] } });

      // Install now renders the before/after slider (previously it showed no slider).
      expect(screen.getByAltText('New-paver look (simulated)')).toBeDefined();
      expect(screen.getByAltText('Before')).toBeDefined();
      expect(screen.getByText(/design consult finalizes your new install/i)).toBeDefined();
    } finally {
      URL.createObjectURL = origCreate;
      URL.revokeObjectURL = origRevoke;
    }
  });
});
