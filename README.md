# Project Overview

This project is a Next.js application designed to scrape and analyze government tenders in South Africa. The primary goal is to provide insights and recommendations for businesses in the logistics industry to identify and pursue relevant tender opportunities.

## Key Features

1. **Tender Scraping**: The application uses puppeteer to scrape tender information from government websites, including details such as category, description, advertised date, and closing date.
2. **AI-Powered Insights**: Utilizing OpenAI's GPT-4 model, the application generates recommendations for logistics businesses based on the scraped tender data, highlighting the most promising opportunities and providing reasons why they are suitable.
3. **API Routes**: The project includes API routes for fetching tender data, tender details, and AI-generated insights. These routes can be used to integrate the application with other systems or to build custom interfaces.
4. **User Interface**: A user-friendly interface is provided to display the scraped tender data and AI-generated insights, making it easy for logistics businesses to explore and act on tender opportunities.

## Technical Details

- **Frontend**: Built using Next.js for server-side rendering and React for the user interface.
- **Backend**: Utilizes Next.js API routes for server-side logic and data fetching.
- **Scraping**: Puppeteer is used for web scraping, allowing for dynamic page loading and interaction.
- **AI Integration**: OpenAI's GPT-4 model is integrated for generating insights and recommendations based on the scraped data.
- **Database**: No database is used in this project, as the focus is on real-time scraping and analysis.

## Getting Started

To run the project, follow these steps:

1. Clone the repository to your local machine.
2. Install the required dependencies using `npm install` or `yarn install`.
3. Start the development server using `npm run dev` or `yarn dev`.
4. Open your web browser and navigate to `http://localhost:3000` to view the application.

## Contributing

Contributions are welcome! If you'd like to contribute to this project, please fork the repository, make your changes, and submit a pull request.
