import { Navigate, Route, Routes } from 'react-router-dom'
import { Footer, Header } from './components/Header'
import { ScrollToTop, Toasts } from './components/ui'
import Home from './pages/Home'
import Listings from './pages/Listings'
import ListingDetail from './pages/ListingDetail'
import PostAd from './pages/PostAd'
import SellerProfile from './pages/SellerProfile'
import Saved from './pages/Saved'
import Messages from './pages/Messages'
import Auth from './pages/Auth'
import Agents from './pages/Agents'
import PriceCheck from './pages/PriceCheck'
import MyAds from './pages/MyAds'
import Info from './pages/Info'
import NotFound from './pages/NotFound'
import States from './pages/States'

export default function App() {
  return (
    <>
      <ScrollToTop />
      <Header />
      <div className="app-body">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/listing/:id/:slug?" element={<ListingDetail />} />
          <Route path="/sell" element={<PostAd />} />
          <Route path="/seller/:id" element={<SellerProfile />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/messages/:threadId?" element={<Messages />} />
          <Route path="/login" element={<Auth mode="login" />} />
          <Route path="/register" element={<Auth mode="register" />} />
          <Route path="/agents" element={<Agents />} />
          <Route path="/price-check" element={<PriceCheck />} />
          <Route path="/states" element={<States />} />
          <Route path="/my-ads" element={<MyAds />} />
          <Route path="/about" element={<Info kind="about" />} />
          <Route path="/safety" element={<Info kind="safety" />} />
          <Route path="/terms" element={<Info kind="terms" />} />
          <Route path="/privacy" element={<Info kind="privacy" />} />
          <Route path="/real-estate" element={<Navigate to="/port-harcourt/real-estate" replace />} />
          <Route path="/:city/:category" element={<Listings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>
      <Footer />
      <Toasts />
    </>
  )
}
