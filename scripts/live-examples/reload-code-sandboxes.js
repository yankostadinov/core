const https = require('https');

const codeSandboxUrls = [
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/basic-interop',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/invocation-target',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/method-discovery-by-event',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/method-discovery-by-name',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/server-discovery',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/stream-events',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/stream-pub-sub',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/interop/stream-subscription-request',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/contexts/context-discovery',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/contexts/context-get-set',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/contexts/context-subscription',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/windows/window-events',
    'https://codesandbox.io/s/github/Glue42/core/tree/master/live-examples/windows/window-opening'
];

function reload(url) {
    return new Promise((resolve) => {
        const request = https.get(url, (response) => {
            response.on('data', () => { });
            response.on('end', () => resolve({
                url,
                success: true
            }));
        });

        request.on('error', (error) => resolve({
            url,
            error,
            success: false
        }));
    });
}

async function reloadAll(urls) {
    const results = await Promise.all(urls.map(reload));

    const failed = results.filter(({ success }) => success === false);
    if (failed.length === 0) {
        console.log('All code-sandboxes reloaded.');
        return;
    }

    console.log(`Failed ${failed.length}/${results.length}:`);
    failed.forEach(({ url, error }) => {
        console.log(`${url} failed with error: `, error);
    });
}

reloadAll(codeSandboxUrls);
