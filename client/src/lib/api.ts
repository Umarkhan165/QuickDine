import axios from "axios";

const api = axios.create({
    baseURL:import.meta.env.VITE_API_URL || "http://localhost:5000/api",
    headers:{
        "Content-Type": "application/json"
    }
});

// Request Interceptor to attach JWT token
api.interceptors.request.use(
    (config)=>{
        const token = localStorage.getItem("token")
        if(token){
            config.headers.Authorization = `Bearer ${token}`
        }
        return config
    },
    (error)=>{
        return Promise.reject(error)
    }
)

// Response Interceptor to handle token refresh and errors
// api.interceptors.response.use(
//     (response)=>response,
//     async(error)=>{
//         const originalRequest = error.config
//         const status = error.response?.status

//         if(status === 401 && !originalRequest._retry){
//             originalRequest._retry = true
//             const refreshToken = localStorage.getItem("refreshToken")
//             if(refreshToken){
//                 try{
//                     const response = await api.post("/auth/refresh",{refreshToken})
//                     const {token:newToken,refreshToken:newRefreshToken} = response.data.data
//                     localStorage.setItem("token",newToken)
//                     localStorage.setItem("refreshToken",newRefreshToken)
//                     originalRequest.headers.Authorization = `Bearer ${newToken}`
//                     return api(originalRequest)
//                 }catch(refreshError){
                    
//                 }
//             }
//         }
//     }
// )



export default api
