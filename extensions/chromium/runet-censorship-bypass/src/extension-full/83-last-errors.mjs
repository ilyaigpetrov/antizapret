
const chromified = globalThis.utils.chromified;

const lastErrors = [];
const lastErrorsLength = 20;

const state = await globalThis.utils.createstate('err-to-exc');
const IF_COLL_KEY = 'if-coll';


const privates = {
  ifCollecting: (await state.get(IF_COLL_KEY)) || false,
};

const that = globalThis.apis.lastNetErrors = {
  get ifCollecting() {

    return privates.ifCollecting;

  },

  set ifCollecting(newValue) {

    privates.ifCollecting = newValue;
    state.set(IF_COLL_KEY, newValue);

  },
  get: () => lastErrors,
};

chrome.webRequest.onErrorOccurred.addListener(chromified((err/* Ignored */, details) => {

  if (!that.ifCollecting || [
    'net::ERR_BLOCKED_BY_CLIENT',
    'net::ERR_ABORTED',
    'net::ERR_CACHE_MISS',
    'net::ERR_INSUFFICIENT_RESOURCES',
  ].includes(details.error) ) {
    return;
  }
  const last = lastErrors[0];
  if (last && details.error === last.error && details.url === last.url) {
    // Dup.
    return;
  }

  lastErrors.unshift(details);
  if (lastErrors.length > lastErrorsLength) {
    lastErrors.pop();
  }

}), {urls: ['<all_urls>']},
);