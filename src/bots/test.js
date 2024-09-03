const text = `{"days": [{"schedule": [{"time": "11AM", "activity": "Arrive in Rome, Check-in at Hotel", "location": "Your Hotel"}], "restaurants": []}, {"schedule": [{"time": "9AM", "activity": "Visit the Colosseum and Roman Forum", "location": "Colosseum/Roman Forum"}, {"time": "12PM", "activity": "Vegan Lunch", "location": "Ops!"}, {"time": "2PM", "activity": "Explore Trastevere", "location": "Trastevere"}, {"time": "5PM", "activity": "Sensory-Friendly Time at your Hotel", "location": "Your Hotel"}], "restaurants": [{"activity": "Vegan Lunch", "name": "Ops!"}, {"activity": "Vegan Dinner", "name": "Flower Burger"}]}, {"schedule": [{"time": "9AM", "activity": "Visit the Vatican Museums & Sistine Chapel", "location": "Vatican City"}, {"time": "12PM", "activity": "Vegan Lunch", "location": "Il Margutta Vegetarian Food & Art"}, {"time": "2PM", "activity": "Relax at the hotel or explore nearby", "location": "Near your Hotel"}, {"time": "6PM", "activity": "Vegan Dinner", "location": "So What?!"}], "restaurants": [{"activity": "Vegan Lunch", "name": "Il Margutta Vegetarian Food & Art"}, {"activity": "Vegan Dinner", "name": "So What?!"}]}, {"schedule": [{"time": "9AM", "activity": "Visit the Pantheon and Trevi Fountain", "location": "Pantheon/Trevi Fountain"}, {"time": "11AM", "activity": "Vegan Lunch", "location": "Buddy Veggy Restaurant"}, {"time": "1PM", "activity": "Explore the Borghese Gallery", "location": "Borghese Gallery"}, {"time": "4PM", "activity": "Sensory-Friendly Break", "location": "Your Hotel"}], "restaurants": [{"activity": "Vegan Lunch", "name": "Buddy Veggy Restaurant"}, {"activity": "Vegan Dinner", "name": "Romeow Cat Bistrot"}]}, {"schedule": [{"time": "9AM", "activity": "Visit the Catacombs of Rome", "location": "Catacombs of Rome"}, {"time": "11AM", "activity": "Vegan Lunch", "location": "Arancia Blu"}, {"time": "1PM", "activity": "Last minute Souvenir Shopping", "location": "City Center"}, {"time": "3PM", "activity": "Head to Airport", "location": "Airport"}], "restaurants": [{"activity": "Vegan Lunch", "name": "Arancia Blu"}]}], "tips": ["Download a translation app to help with communication.", "Carry a city map with key locations marked, including your hotel.", "Use noise-canceling headphones or earplugs if crowded places are overwhelming.", "Inform restaurants in advance about your dietary restrictions.", "Pre-book tickets for popular attractions online to avoid queues.", "Communicate your needs and preferences clearly to your travel companion.", "Take breaks throughout the day to avoid sensory overload."]}\n false`;

function trimNonJSON(text) {
    if (text[text.length - 1] === "}" && text[0] === "{") return text;

    const startIndex = text.indexOf("{");
    if (startIndex === -1) return null;

    const endIndex = text.lastIndexOf("}");
    if (endIndex === -1) return null;

    return text.slice(startIndex, endIndex - startIndex + 1);
}

console.log(trimNonJSON(text));
