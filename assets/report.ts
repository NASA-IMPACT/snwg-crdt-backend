import type { Report, ReportDocument } from '../app/utils/report.ts';

export const reportDocument: ReportDocument = {
    // FIXME: handle this
    // "department": "Environmental Protection Agency/Office of Research and Development",
    // "department_abvr": "EPA/ORD",
    // "thematic_area": "Carbon Cycle & Ecosystems",
    synopsis: {
        children: [
            {
                type: 'p',
                children: [
                    {
                        text: 'This submission addresses ',
                    },
                    {
                        text: '[topic/focus]',
                        italic: true,
                    },
                    {
                        text: ', highlighting current challenges and innovations in ',
                    },
                    {
                        text: '[relevant field]',
                        italic: true,
                    },
                    {
                        text: ' and providing actionable insights for the ',
                    },
                    {
                        type: 'a',
                        children: [
                            {
                                text: 'SNWG',
                            },
                        ],
                        url: 'https://www.earthdata.nasa.gov/data/projects/nsite/solutions',
                    },
                    {
                        text: ' community.',
                    },
                ],
            },
            {
                type: 'p',
                children: [
                    {
                        text: '',
                    },
                ],
            },
            {
                type: 'sub-section',
                children: [
                    {
                        text: 'Objectives',
                    },
                    {
                        text: '[2]',
                        superscript: true,
                    },
                ],
            },
            {
                type: 'ol',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Identify key challenges',
                                        bold: true,
                                    },
                                    {
                                        text: ' in [specific area].',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Present innovative solutions or findings',
                                        bold: true,
                                    },
                                    {
                                        text: ' derived from research or practice.',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Encourage discussion and knowledge-sharing',
                                        bold: true,
                                    },
                                    {
                                        text: ' among ',
                                    },
                                    {
                                        text: 'SNWG',
                                        underline: true,
                                    },
                                    {
                                        text: ' participants.',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                type: 'p',
                children: [
                    {
                        text: '',
                    },
                ],
            },
            {
                type: 'sub-section',
                children: [
                    {
                        text: 'Key Highlights',
                    },
                    {
                        text: '[3]',
                        superscript: true,
                    },
                ],
            },
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Practical insights',
                                        bold: true,
                                    },
                                    {
                                        text: ' for real-world applications',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Data-driven findings',
                                        bold: true,
                                    },
                                    {
                                        text: ' supporting decision-making',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Emerging trends',
                                        bold: true,
                                    },
                                    {
                                        text: ' and their implications',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Collaborative approaches',
                                        bold: true,
                                    },
                                    {
                                        text: ' for problem-solving',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
            {
                type: 'p',
                children: [
                    {
                        text: '',
                    },
                ],
            },
        ],
    },
    resources: {
        children: [
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'USGS NWIS',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Water data access',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'NOAA NCEI',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Climate, ocean, geophysical datasets',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'USGS Earth Explorer',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Satellite imagery',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'NOAA Digital Coast',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Coastal management tools',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'USGS Publications Warehouse',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Research and reports',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'NOAA Climate Data Online (CDO)',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Climate datasets',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    detailed_assessment: {
        children: [
            {
                type: 'p',
                children: [
                    {
                        text: '',
                    },
                ],
            },
            {
                type: 'table-block',
                children: [
                    {
                        type: 'table',
                        children: [
                            {
                                type: 'tr',
                                children: [
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Assessment Area',
                                                        bold: true,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Criteria',
                                                        bold: true,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Expected Outcome',
                                                        bold: true,
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: 'tr',
                                children: [
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Technical Feasibility',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Accuracy, scalability, reliability',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Demonstrates practical implementation',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: 'tr',
                                children: [
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Impact & Applicability',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Real-world applicability, measurable benefits',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Clear guidance for practical adoption',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                            {
                                type: 'tr',
                                children: [
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Relevance to SNWG Themes',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Alignment with 2024 focus areas',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                    {
                                        type: 'td',
                                        children: [
                                            {
                                                type: 'p',
                                                children: [
                                                    {
                                                        text: 'Provides valuable insights to attendees',
                                                    },
                                                ],
                                            },
                                        ],
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'caption',
                        children: [
                            {
                                text: 'Assessment areas and outcomes',
                            },
                        ],
                    },
                ],
            },
            {
                type: 'p',
                children: [
                    {
                        text: '',
                    },
                ],
            },
        ],
    },
    missions_phase_c: {
        children: [
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Landsat Next',
                                        bold: true,
                                    },
                                    {
                                        text: ' – High-resolution land imaging',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'SWOT',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Surface water and ocean topography',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'ICESat-2',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Ice, sea, and land elevation',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'NISAR',
                                        bold: true,
                                    },
                                    {
                                        text: ' – High-resolution radar observations',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'TEMPO',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Air pollution monitoring',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    decadal_survey: {
        children: [
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Decadal Survey:',
                                        bold: true,
                                    },
                                    {
                                        text: ' Guides long-term priorities and mission planning',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Designated Observables:',
                                        bold: true,
                                    },
                                    {
                                        text: ' Target high-priority Earth system variables',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Incubator Programs:',
                                        bold: true,
                                    },
                                    {
                                        text: ' Support innovation, pilot studies, and technology demos',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    training_resources: {
        children: [
            {
                type: 'ul',
                children: [
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'USGS/NOAA online portals',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Tutorials, webinars, courses',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'NASA ARSET',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Satellite data applications',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'ESIP Education & Training',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Data management workshops',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'NOAA NWS Training',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Forecasting, hydrology, climate',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'USGS Field Training',
                                        bold: true,
                                    },
                                    {
                                        text: ' – Hands-on geospatial and remote sensing',
                                    },
                                ],
                            },
                        ],
                    },
                    {
                        type: 'li',
                        children: [
                            {
                                type: 'p',
                                children: [
                                    {
                                        text: 'Open-source toolkits',
                                        bold: true,
                                    },
                                    {
                                        text: ' – GIS, Python, R, and analysis tools',
                                    },
                                ],
                            },
                        ],
                    },
                ],
            },
        ],
    },
    summary_proposed_activities: [
        62,
        65,
    ],
    snwg_products: [
        37,
    ],
    commercial_products: [
        1,
    ],
    missions_selected: [
        {
            mission_id: 'fcc2ce25-5d6c-072d-fbc4-76efe4aa3185',
            instrument_ids: [
                'c8c2ce1f-c304-48e1-3171-5c05efea2bb1',
                'c0ca54b2-de9a-36c4-c47c-ae4b1fc33888',
            ],
        },
        {
            mission_id: '10c2ce25-e90a-3759-6b23-0e48c28199ff',
            instrument_ids: [
                'e2c2ce20-329d-4543-fb03-912d238500e7',
            ],
        },
        {
            mission_id: '-1',
            instrument_ids: [],
        },
    ],
    upcoming_missions_selected: [
        {
            mission_id: 'e4c2efcc-b927-d63a-580f-85f564508e91',
            instrument_ids: [
                '84c2ef9d-86b3-828e-9c15-97b9e4e303f5',
            ],
        },
        {
            mission_id: '20c2ce26-c815-c64a-28ed-2b1b811d2736',
            instrument_ids: [],
        },
    ],
    cmr_products: [
        'C3322810210-LPCLOUD',
        'C2021957295-LPCLOUD',
    ],
};

export const report: Report = {
    version: 'v1.0',
    document: reportDocument,
    last_updated_at: '2026-01-28T07:14:26.347466+00:00',
    sections_completed: {
        department: 'incomplete',
        synopsis: 'complete',
        assessment_response: 'complete',
        summary_sensors_products: 'incomplete',
        training_resources: 'incomplete',
    },
};

export const reportFromBackend = {
    id: 492,
    assessment_cycle_year: 2024,
    created_by: '5fb31016-75bc-419f-828a-9446ce8c77fd',
    created_at: '2026-01-28T06:52:04.059774+00:00',
    last_updated_by: '5fb31016-75bc-419f-828a-9446ce8c77fd',
    last_updated_at: '2026-01-28T06:52:04.059774+00:00',
    title: 'SNWG-2024 Assessment Report SNWG Need #178',
    versions: [
        {
            major: 1,
            minor: 0,
            version: report.version,
            status: 'DRAFT',
            sections_completed: report.sections_completed,
            created_by: {
                preferred_username: 'Carlos Curator',
                sub: '5fb31016-75bc-419f-828a-9446ce8c77fd',
                email: 'curator@example.com',
                cognito_groups: [
                    'curator',
                ],
            },
            created_at: '2026-01-28T06:52:04.129715+00:00',
            last_updated_by: {
                preferred_username: 'Carlos Curator',
                sub: '5fb31016-75bc-419f-828a-9446ce8c77fd',
                email: 'curator@example.com',
                cognito_groups: [
                    'curator',
                ],
            },
            last_updated_at: report.last_updated_at,
            citation: {},
            document: report.document,
            keywords: [],
            owner: {
                preferred_username: 'Carlos Curator',
                sub: '5fb31016-75bc-419f-828a-9446ce8c77fd',
                email: 'curator@example.com',
                cognito_groups: [
                    'curator',
                ],
            },
            authors: [],
            reviewers: [],
            publication_checklist: {
                suggested_reviewers: [],
                review_roles: false,
                journal_editor: 'Chelle Gentemann',
                author_affirmations: false,
            },
            publication_units: {
                words: 278,
                images: 0,
                tables: 1,
            },
        },
    ],
};
