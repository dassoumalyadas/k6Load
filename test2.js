import http from "k6/http";
import { sleep } from "k6";
import { check } from "k6";
import { Trend } from "k6/metrics";

// 1. Declare custom metrics in the init/global scope
const pizza_response_timing = new Trend("pizza_response_timing");

const pizza_request_timing = new Trend("pizza_request_timing");

export const options = {
    // vus: 3,
    // duration: '10s',

    thresholds: {
        'http_req_duration': ['p(95)< 300'],
        'http_req_failed': ['rate<0.1'],
        // 'checks': ['rate' > 0.09],
        'http_req_duration{name:"Explore Page"}': ['p(95)<300'],
        'http_req_failed{name:"Explore Page"}': ['rate<0.5'],
        'pizza_response_timing': ['p(95)<300'],
        'pizza_request_timing': ['p(95)<300']
    },
    stages: [
        { duration: '4s', target: 2 }, // Ramp up to 2 VUs over 4 secs
        { duration: '5s', target: 5 }, // Ramp up to 5 more users over 5 secs
        { duration: '3s', target: 0 }, // Ramp down to 0 users over 3 seconds
    ]
};

export default function () {
    // 2. Fetch response first before accessing response.timings
    const response = http.get("https://quickpizza.grafana.com/");
    pizza_response_timing.add(response.timings.waiting);
    pizza_request_timing.add(response.timings.sending);

    // 3. Return the boolean result in the check arrow function
    check(response, {
        'status code is 200': (r) => r.status === 200,
        'response contains pizza': (r) => r.body.includes("pizza"),
    });

    http.get("https://quickpizza.grafana.com/public/datasources/24/explore?left[queries][0][datasourceId]=24", {
        tags: { name: "Explore Page" }
    });

    sleep(1);
}