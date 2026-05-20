const TYNKR_REGISTRY = {
    scaler: "https://builtbyjoshstudio-cyber.github.io/recipe-scaler/",
    reverseRoast: "https://builtbyjoshstudio-cyber.github.io/reverse-roasting-timeline/",
    panSwap: "https://builtbyjoshstudio-cyber.github.io/pan-swap-calculator/",
    roastPull: "https://builtbyjoshstudio-cyber.github.io/perfect-roast-pull-temp-calculator/",
    brine: "https://builtbyjoshstudio-cyber.github.io/brine-calculator/",
    thawing: "https://builtbyjoshstudio-cyber.github.io/meat-thawing-planner/",
    hub: "https://builtbyjoshstudio.com/tools/"
};

function getToolUrl(toolId, params = {}) {
    let baseUrl = TYNKR_REGISTRY[toolId] || TYNKR_REGISTRY['hub'];
    if (Object.keys(params).length > 0) {
        const queryString = new URLSearchParams(params).toString();
        baseUrl += `?${queryString}`;
    }
    return baseUrl;
}

// Global state variables
let currentUnit = 'lbs'; // 'lbs' or 'kg'

// Ingestion of URL Parameters
function parseUrlParameters() {
    const params = new URLSearchParams(window.location.search);
    const weight = params.get('weight');
    const unit = params.get('unit');
    const protein = params.get('protein');

    if (unit && (unit.toLowerCase() === 'kg' || unit.toLowerCase() === 'metric')) {
        currentUnit = 'kg';
        document.getElementById("unit-imperial").classList.remove("active");
        document.getElementById("unit-metric").classList.add("active");
        document.getElementById("weight-label").textContent = "Weight (kg)";
    } else {
        currentUnit = 'lbs';
        document.getElementById("unit-metric").classList.remove("active");
        document.getElementById("unit-imperial").classList.add("active");
        document.getElementById("weight-label").textContent = "Weight (lbs)";
    }

    if (protein) {
        const select = document.getElementById("protein-type");
        const lowerProtein = protein.toLowerCase();
        for (let option of select.options) {
            if (option.value.toLowerCase() === lowerProtein || option.text.toLowerCase().includes(lowerProtein)) {
                select.value = option.value;
                break;
            }
        }
    }

    if (weight) {
        document.getElementById("meat-weight").value = parseFloat(weight) || 12;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // Theme switching logic
    const themeBtns = document.querySelectorAll(".theme-switch button");
    themeBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            const theme = btn.getAttribute("data-set-theme");
            document.documentElement.setAttribute("data-theme", theme);
            themeBtns.forEach(b => b.classList.remove("on"));
            btn.classList.add("on");
        });
    });

    // Parse incoming params
    parseUrlParameters();

    // Inputs
    const unitImperialBtn = document.getElementById("unit-imperial");
    const unitMetricBtn = document.getElementById("unit-metric");
    const proteinType = document.getElementById("protein-type");
    const meatWeight = document.getElementById("meat-weight");
    const weightLabel = document.getElementById("weight-label");
    const calculateBtn = document.getElementById("calculate-btn");

    // Outputs
    const fridgeTimeOutput = document.getElementById("fridge-time-output");
    const waterTimeOutput = document.getElementById("water-time-output");
    const safetyWarningContainer = document.getElementById("safety-warning-container");
    const waterCard = document.getElementById("water-card");

    // Unit toggle event listeners
    unitImperialBtn.addEventListener("click", () => {
        if (currentUnit !== 'lbs') {
            currentUnit = 'lbs';
            unitImperialBtn.classList.add("active");
            unitMetricBtn.classList.remove("active");
            weightLabel.textContent = "Weight (lbs)";
            
            // Auto convert value
            const currentVal = parseFloat(meatWeight.value) || 0;
            if (currentVal > 0) {
                meatWeight.value = (currentVal * 2.20462).toFixed(1);
            }
            calculateThawing();
        }
    });

    unitMetricBtn.addEventListener("click", () => {
        if (currentUnit !== 'kg') {
            currentUnit = 'kg';
            unitMetricBtn.classList.add("active");
            unitImperialBtn.classList.remove("active");
            weightLabel.textContent = "Weight (kg)";
            
            // Auto convert value
            const currentVal = parseFloat(meatWeight.value) || 0;
            if (currentVal > 0) {
                meatWeight.value = (currentVal / 2.20462).toFixed(1);
            }
            calculateThawing();
        }
    });

    // Main calculation function
    function calculateThawing() {
        const weightInput = parseFloat(meatWeight.value) || 0;
        const protein = proteinType.value;

        if (weightInput <= 0) {
            fridgeTimeOutput.textContent = "--";
            waterTimeOutput.textContent = "--";
            safetyWarningContainer.style.display = "none";
            return;
        }

        // Convert weight to lbs internally for calculation standard rules
        let weightLbs = weightInput;
        if (currentUnit === 'kg') {
            weightLbs = weightInput * 2.20462;
        }

        // Fridge thawing timeline: 4.5 lbs/day scaling
        const fridgeHours = (weightLbs / 4.5) * 24;
        
        // Cold water thawing timeline: 0.5 hours/lb water scaling rules
        const waterHours = weightLbs * 0.5;

        // Display results
        fridgeTimeOutput.textContent = formatFridgeTime(fridgeHours);
        waterTimeOutput.textContent = formatWaterTime(waterHours);

        // Safety warning trigger: Cold water thawing duration exceeds 6 hours
        if (waterHours > 6) {
            safetyWarningContainer.innerHTML = `⚠️ Safety Warning: Cold water thawing for proteins of this size exceeds 6 hours. To prevent exponential bacterial growth in the 'Danger Zone' (40°F to 140°F), refrigerator thawing is strictly recommended for this weight class.`;
            safetyWarningContainer.style.display = "block";
            waterCard.style.borderColor = "color-mix(in oklab, var(--neg) 50%, transparent)";
        } else {
            safetyWarningContainer.style.display = "none";
            waterCard.style.borderColor = "color-mix(in oklab, var(--neg) 30%, transparent)";
        }

        // Update pipeline links in real-time
        updatePipelineLinks(weightInput, currentUnit, protein);
    }

    // Helper to format fridge time
    function formatFridgeTime(totalHours) {
        if (totalHours < 24) {
            return `${Math.ceil(totalHours)} hrs`;
        }
        const days = Math.floor(totalHours / 24);
        const remainingHours = Math.ceil(totalHours % 24);
        if (remainingHours === 0) {
            return `${days} ${days === 1 ? 'day' : 'days'}`;
        }
        return `${days} ${days === 1 ? 'day' : 'days'}, ${remainingHours} ${remainingHours === 1 ? 'hr' : 'hrs'}`;
    }

    // Helper to format water time
    function formatWaterTime(totalHours) {
        const hours = Math.floor(totalHours);
        const minutes = Math.round((totalHours - hours) * 60);
        if (hours === 0) {
            return `${minutes} mins`;
        }
        if (minutes === 0) {
            return `${hours} ${hours === 1 ? 'hr' : 'hrs'}`;
        }
        return `${hours} ${hours === 1 ? 'hr' : 'hrs'}, ${minutes} mins`;
    }

    // Dynamic next-steps update
    function updatePipelineLinks(weight, unit, protein) {
        const pipelineLinkBrine = document.getElementById("pipeline-link-brine");
        const pipelineLinkReverse = document.getElementById("pipeline-link-reverse");

        if (pipelineLinkBrine) {
            pipelineLinkBrine.href = getToolUrl('brine', { weight: weight, unit: unit, protein: protein });
        }
        if (pipelineLinkReverse) {
            pipelineLinkReverse.href = getToolUrl('reverseRoast', { weight: weight, unit: unit, protein: protein });
        }
    }

    // Calculate on button click
    calculateBtn.addEventListener("click", calculateThawing);

    // Initial calculation on load
    calculateThawing();
});
