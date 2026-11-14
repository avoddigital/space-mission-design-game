// Flags of the 2026 Space Apps partner countries, Europe and the United States, from the flag-icons package (MIT license).
// Only these 18 files are bundled. Each import is a URL to an SVG file.

import ao from 'flag-icons/flags/4x3/ao.svg?url';
import ar from 'flag-icons/flags/4x3/ar.svg?url';
import bh from 'flag-icons/flags/4x3/bh.svg?url';
import br from 'flag-icons/flags/4x3/br.svg?url';
import ca from 'flag-icons/flags/4x3/ca.svg?url';
import eu from 'flag-icons/flags/4x3/eu.svg?url';
import inFlag from 'flag-icons/flags/4x3/in.svg?url';
import it from 'flag-icons/flags/4x3/it.svg?url';
import jp from 'flag-icons/flags/4x3/jp.svg?url';
import ng from 'flag-icons/flags/4x3/ng.svg?url';
import py from 'flag-icons/flags/4x3/py.svg?url';
import sn from 'flag-icons/flags/4x3/sn.svg?url';
import kr from 'flag-icons/flags/4x3/kr.svg?url';
import es from 'flag-icons/flags/4x3/es.svg?url';
import tr from 'flag-icons/flags/4x3/tr.svg?url';
import ae from 'flag-icons/flags/4x3/ae.svg?url';
import gb from 'flag-icons/flags/4x3/gb.svg?url';
import us from 'flag-icons/flags/4x3/us.svg?url';

export const FLAGS = Object.freeze({ ao, ar, bh, br, ca, eu, in: inFlag, it, jp, ng, py, sn, kr, es, tr, ae, gb, us });

/** An <img> of the flag. Decorative: the country name is always written next to it. */
export function flag(countryId, className = 'flag') {
  const src = FLAGS[countryId];
  return src ? `<img class="${className}" src="${src}" alt="" width="40" height="30">` : '';
}
