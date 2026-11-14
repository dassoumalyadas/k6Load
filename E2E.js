import { check } from 'k6';
import http from 'k6/http'

const BASE_URL = "http://quickpizza.grafana.com";
const USERNAME = "soumalya1"
const PASSWORD = "pass123"

export const options = {

}


export default function () {
    const headers = {
        "Content-Type": "application/json",
    }

    const body = {
        "username": USERNAME,
        "password": PASSWORD
    }

    const res = http.post(`${BASE_URL}/api/users`, JSON.stringify(body), headers);

    check(res => {
        res.status == 201 || "Login failed",
            res.body.includes(USERNAME) || "Login failed"
    })
}