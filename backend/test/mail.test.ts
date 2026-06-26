import { describe, expect, it } from 'vitest';
import { escapeHtml } from '../src/utils/html.js';

describe('escapeHtml', () => {
  it('escapes user-controlled values before email rendering', () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'test'`)).toBe(
      '&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#039;test&#039;',
    );
  });
});
