// Tax Calculator Constants
// Standard deduction amounts for FY 2023-24 (in INR)
const STANDARD_DEDUCTION = {
    single: 50000, // Standard deduction for individuals
    married_joint: 50000, // Same for married individuals (no joint filing in India)
    married_separate: 50000, // Same for married individuals filing separately
    head: 50000, // Same for head of household
    widow: 50000, // Same for widow
};

// Indian Tax Brackets for FY 2023-24 (in INR)
// New Tax Regime (default from FY 2023-24)
const NEW_TAX_REGIME = [
    { min: 0, max: 300000, rate: 0 },
    { min: 300001, max: 600000, rate: 0.05 },
    { min: 600001, max: 900000, rate: 0.10 },
    { min: 900001, max: 1200000, rate: 0.15 },
    { min: 1200001, max: 1500000, rate: 0.20 },
    { min: 1500001, max: Infinity, rate: 0.30 },
];

// Tax brackets mapping for different filing statuses
const TAX_BRACKETS = {
    single: NEW_TAX_REGIME,
    married_joint: NEW_TAX_REGIME,
    married_separate: NEW_TAX_REGIME,
    head: NEW_TAX_REGIME,
    widow: NEW_TAX_REGIME,
};

// Tax Calculation Function
function calculateTaxRefund(data) {
    // Calculate total income
    const totalIncome = 
        (parseFloat(data.wages) || 0) + 
        (parseFloat(data.selfEmploymentIncome) || 0) + 
        (parseFloat(data.investmentIncome) || 0) + 
        (parseFloat(data.otherIncome) || 0);
    
    // Calculate deductions
    const standardDeduction = STANDARD_DEDUCTION[data.filingStatus] || STANDARD_DEDUCTION.single;
    
    const itemizedDeductions = 
        (parseFloat(data.studentLoanInterest) || 0) + 
        (parseFloat(data.charitableContributions) || 0) + 
        (parseFloat(data.medicalExpenses) || 0);
    
    // Use the greater of standard or itemized deductions
    const totalDeductions = Math.max(standardDeduction, itemizedDeductions);
    
    // Calculate taxable income
    const taxableIncome = Math.max(0, totalIncome - totalDeductions);
    
    // Calculate tax liability based on tax brackets
    const brackets = TAX_BRACKETS[data.filingStatus] || TAX_BRACKETS.single;
    
    let taxLiability = 0;
    let remainingIncome = taxableIncome;
    
    for (const bracket of brackets) {
        const taxableInBracket = Math.min(
            Math.max(0, remainingIncome),
            bracket.max - bracket.min + 1
        );
        
        taxLiability += taxableInBracket * bracket.rate;
        remainingIncome -= taxableInBracket;
        
        if (remainingIncome <= 0) break;
    }
    
    // Calculate credits (in INR)
    let totalCredits = 0;
    
    // Section 80C deductions (investments, insurance, etc.)
    if (data.childTaxCredit && parseInt(data.dependents) > 0) {
        // Simulate Section 80C deduction for dependent family members
        totalCredits += Math.min(parseInt(data.dependents) * 25000, 150000); // Max 1.5 lakh limit
    }
    
    // Education loan interest deduction (Section 80E)
    if (data.educationCredits) {
        totalCredits += Math.min(parseFloat(data.studentLoanInterest) || 0, 50000); // No limit, but simplified here
    }
    
    // Calculate final tax liability
    const finalTaxLiability = Math.max(0, taxLiability - totalCredits);
    
    // Calculate refund or amount owed
    const taxWithheld = parseFloat(data.taxWithheld) || 0;
    const estimatedRefund = taxWithheld - finalTaxLiability;
    
    return {
        totalIncome,
        taxLiability: finalTaxLiability,
        taxWithheld,
        totalDeductions,
        totalCredits,
        estimatedRefund,
    };
}

// Chatbot responses
const taxResponses = {
    tax: "Tax is a mandatory financial charge imposed by the government on individuals or businesses to fund public services and infrastructure.",
    deduction: "Common tax deductions in India include Section 80C investments (up to ₹1.5 lakh), Section 80D health insurance premiums, Section 80E education loan interest, Section 80G charitable donations, and home loan interest (up to ₹2 lakh under Section 24). Keep all receipts and documents as proof for these deductions.",
    credit: "In India, we have tax deductions rather than tax credits. Popular deductions include Section 80TTA for savings account interest (up to ₹10,000), Section 80CCD for NPS contributions, and Section 80GG for house rent if HRA is not received from employer.",
    deadline: "The tax filing deadline in India is usually July 31st for non-audit cases and October 31st for audit cases. Late filing can lead to penalties ranging from ₹5,000 to ₹10,000 depending on the delay. Filing before the deadline is advisable to avoid these penalties.",
    refund: "After filing your ITR (Income Tax Return), you can expect your refund within 20-45 days if everything is in order. You can check the refund status on the Income Tax e-Filing portal using your PAN and acknowledgment number.",
    status: "In India, taxpayers are classified as Individuals, HUF (Hindu Undivided Family), Firms, Companies, and Others. The tax rates and slabs differ based on your category and whether you opt for the new tax regime or the old one.",
    withholding: "TDS (Tax Deducted at Source) is India's withholding tax system where tax is deducted at the source of income. Your employer deducts TDS from your salary based on your projected annual income. Form 26AS shows all TDS deducted in a financial year.",
    audit: "Tax scrutiny (audit) by the Income Tax Department examines whether you've declared all income correctly. Cases are selected based on high-value transactions, discrepancies, or randomly. Maintain proper documentation of all financial transactions to handle scrutiny effectively.",
    default: "I'm your Indian Tax Assistant and can help answer questions about tax deductions under various sections, filing deadlines, TDS, and more. Feel free to ask me any tax-related questions specific to the Indian taxation system."
};

// Format currency
function formatCurrency(amount) {
    return new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency: 'INR',
        maximumFractionDigits: 0
    }).format(amount);
}

// Initialize on DOM load
document.addEventListener('DOMContentLoaded', function() {
    // Calculator navigation
    const steps = document.querySelectorAll('.step');
    const formSteps = document.querySelectorAll('.form-step');
    
    // Next and Previous buttons
    document.getElementById('next-to-2').addEventListener('click', function() {
        // Validate step 1
        const filingStatus = document.getElementById('filing-status').value;
        const age = document.getElementById('age').value;
        
        if (!filingStatus) {
            alert('Please select your filing status');
            return;
        }
        
        if (!age || age <= 0) {
            alert('Please enter a valid age');
            return;
        }
        
        // Move to step 2
        formSteps[0].style.display = 'none';
        formSteps[1].style.display = 'block';
        updateActiveStep(2);
    });
    
    document.getElementById('prev-to-1').addEventListener('click', function() {
        formSteps[1].style.display = 'none';
        formSteps[0].style.display = 'block';
        updateActiveStep(1);
    });
    
    document.getElementById('next-to-3').addEventListener('click', function() {
        // Validate step 2
        const wages = document.getElementById('wages').value;
        
        if (!wages || parseFloat(wages) <= 0) {
            alert('Please enter your wages/salary');
            return;
        }
        
        // Move to step 3
        formSteps[1].style.display = 'none';
        formSteps[2].style.display = 'block';
        updateActiveStep(3);
    });
    
    document.getElementById('prev-to-2').addEventListener('click', function() {
        formSteps[2].style.display = 'none';
        formSteps[1].style.display = 'block';
        updateActiveStep(2);
    });
    
    document.getElementById('prev-to-3').addEventListener('click', function() {
        formSteps[3].style.display = 'none';
        formSteps[2].style.display = 'block';
        updateActiveStep(3);
    });
    
    // Calculate button
    document.getElementById('calculate-btn').addEventListener('click', function() {
        // Validate step 3
        const taxWithheld = document.getElementById('tax-withheld').value;
        
        if (!taxWithheld) {
            alert('Please enter the amount of tax withheld');
            return;
        }
        
        // Collect all form data
        const formData = {
            filingStatus: document.getElementById('filing-status').value,
            age: document.getElementById('age').value,
            dependents: document.getElementById('dependents').value,
            disability: document.getElementById('disability').checked,
            wages: document.getElementById('wages').value,
            selfEmploymentIncome: document.getElementById('self-employment').value,
            investmentIncome: document.getElementById('investment').value,
            otherIncome: document.getElementById('other-income').value,
            taxWithheld: document.getElementById('tax-withheld').value,
            studentLoanInterest: document.getElementById('student-loan').value,
            charitableContributions: document.getElementById('charitable').value,
            medicalExpenses: document.getElementById('medical').value,
            childTaxCredit: document.getElementById('child-tax-credit').checked,
            educationCredits: document.getElementById('education-credits').checked
        };
        
        // Calculate tax refund
        const results = calculateTaxRefund(formData);
        
        // Display results
        document.getElementById('result-total-income').textContent = formatCurrency(results.totalIncome);
        document.getElementById('result-total-deductions').textContent = formatCurrency(results.totalDeductions);
        document.getElementById('result-tax-liability').textContent = formatCurrency(results.taxLiability);
        document.getElementById('result-tax-withheld').textContent = formatCurrency(results.taxWithheld);
        document.getElementById('result-total-credits').textContent = formatCurrency(results.totalCredits);
        document.getElementById('result-estimated-refund').textContent = formatCurrency(results.estimatedRefund);
        
        // Move to results step
        formSteps[2].style.display = 'none';
        formSteps[3].style.display = 'block';
        updateActiveStep(4);
    });
    
    // Reset button
    document.getElementById('reset-calculator').addEventListener('click', function() {
        document.getElementById('tax-calculator-form').reset();
        formSteps[3].style.display = 'none';
        formSteps[0].style.display = 'block';
        updateActiveStep(1);
    });
    
    // Scroll to calculator
    document.getElementById('get-started').addEventListener('click', function() {
        document.getElementById('calculator').scrollIntoView({ behavior: 'smooth' });
    });
    
    // Update active step indicator
    function updateActiveStep(stepNumber) {
        steps.forEach((step, index) => {
            if (index + 1 <= stepNumber) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
    }
    
    // Chatbot Functionality
    const chatbotToggleBtn = document.getElementById('chatbot-toggle-btn');
    const chatbotCloseBtn = document.getElementById('chatbot-close-btn');
    const chatbotContainer = document.querySelector('.chatbot-container');
    const chatbotForm = document.getElementById('chatbot-form');
    const chatbotInput = document.getElementById('chatbot-input-text');
    const chatbotMessages = document.getElementById('chatbot-messages');
    
    // Initialize chatbot with welcome messages
    addBotMessage("Hello! I'm your Tax Assistant. How can I help you with your tax questions today?");
    addBotMessage("Here are some topics I can help with:\n• Tax deductions\n• Filing status\n• Tax deadlines\n• Refund status");
    
    // Toggle chatbot visibility
    chatbotToggleBtn.addEventListener('click', function() {
        chatbotContainer.style.display = chatbotContainer.style.display === 'none' ? 'block' : 'none';
    });
    
    chatbotCloseBtn.addEventListener('click', function() {
        chatbotContainer.style.display = 'none';
    });
    
    // Handle chatbot form submission
    chatbotForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const userInput = chatbotInput.value.trim();
        if (!userInput) return;
        
        // Add user message to chat
        addUserMessage(userInput);
        
        // Process message and get response
        const response = processChatbotMessage(userInput);
        
        // Clear input field
        chatbotInput.value = '';
        
        // Add bot response after a short delay (simulate thinking)
        setTimeout(() => {
            addBotMessage(response);
        }, 500);
    });
    
    // Process chatbot message and return response
    function processChatbotMessage(message) {
        const lowerMessage = message.toLowerCase();
        
        // Simple keyword matching
        for (const [keyword, answer] of Object.entries(taxResponses)) {
            if (keyword !== 'default' && lowerMessage.includes(keyword)) {
                return answer;
            }
        }
        
        // Default response if no keyword match
        return taxResponses.default;
    }
    
    // Add user message to chat
    function addUserMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-user';
        messageElement.textContent = text;
        chatbotMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
    
    // Add bot message to chat
    function addBotMessage(text) {
        const messageElement = document.createElement('div');
        messageElement.className = 'message message-bot';
        messageElement.textContent = text;
        chatbotMessages.appendChild(messageElement);
        
        // Scroll to bottom
        chatbotMessages.scrollTop = chatbotMessages.scrollHeight;
    }
});