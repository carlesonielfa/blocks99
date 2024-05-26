const FLAGS_URI =
    "https://raw.githubusercontent.com/carlesonielfa/blocks99/dc586ebc9f0171139713d07ea9626f9f8579dac7/feature_flags.json";
let flags_loaded = false;
async function loadFlags() {
    try {
        let response = await fetch(FLAGS_URI);
        let flags = await response.json();
        flags_loaded = true;
        console.log("Feature flags loaded", flags);
        return flags;
    } catch (err) {
        flags_loaded = false;
        console.error("Error loading feature flags", err);
        return null;
    }
}
let flags;

export default async function hasFlag(flag) {
    if (!flags_loaded) {
        // Try to load the flags again
        flags = await loadFlags();
    }
    return flags && flags[flag][import.meta.env.VITE_ENVIRONMENT];
}
