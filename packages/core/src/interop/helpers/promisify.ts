export default function(promise: Promise<any>, successCallback: any, errorCallback: any) {

    if (typeof successCallback !== "function" && typeof errorCallback !== "function") {
        return promise;
    }

    if (typeof successCallback !== "function") {
        successCallback = () => { /* DO NOTHING */ };
    } else if (typeof errorCallback !== "function") {
        errorCallback = () => {  /* DO NOTHING */ };
    }

    promise.then(successCallback, errorCallback);
}
