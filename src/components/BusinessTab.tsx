import { Users, Utensils, Star, Heart, Award } from 'lucide-react';
import type { BusinessKpis } from '../types/telemetry';

interface BusinessTabProps {
  business: BusinessKpis | null;
}

export const BusinessTab: React.FC<BusinessTabProps> = ({ business }) => {
  if (!business) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 1rem', color: '#64748b' }}>
        Loading business metrics...
      </div>
    );
  }

  return (
    <div className="fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Banner */}
      <div className="glass-card" style={{ borderColor: 'rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'rgba(139, 92, 246, 0.15)',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            <Award size={26} color="#c084fc" />
          </div>
          <div>
            <h1 style={{ fontSize: '1.35rem', fontWeight: 800, color: '#f8fafc', marginBottom: '0.2rem' }}>
              Cukkie Product & Business Telemetry
            </h1>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
              High-level domain KPIs tracking recipe adoption, user registrations, and community sentiment.
            </p>
          </div>
        </div>
      </div>

      {/* 4 Cards Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
      }}>
        {/* Total Users */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Registered Users</span>
            <Users size={18} color="#3b82f6" />
          </div>
          <div className="metric-value">{business.total_users.toLocaleString()}</div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Authenticated via phone OTP
          </p>
        </div>

        {/* Total Dishes */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Dishes in Catalog</span>
            <Utensils size={18} color="#06b6d4" />
          </div>
          <div className="metric-value">{business.total_dishes.toLocaleString()}</div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Curated recipes with step media & nutrition
          </p>
        </div>

        {/* Dish Reviews */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Customer Reviews</span>
            <Star size={18} color="#fbbf24" />
          </div>
          <div className="metric-value">{business.total_reviews.toLocaleString()}</div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Feedback survey submissions
          </p>
        </div>

        {/* Avg Rating */}
        <div className="glass-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
            <span className="metric-label">Average Satisfaction</span>
            <Star size={18} color="#f59e0b" fill="#f59e0b" />
          </div>
          <div className="metric-value">{business.avg_dish_rating} <span style={{ fontSize: '1.1rem', color: '#64748b' }}>/ 5.0</span></div>
          <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>
            Normalized cross-platform recipe rating
          </p>
        </div>
      </div>

      {/* Top 5 Favorited Recipes */}
      <div className="glass-card">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.625rem', marginBottom: '1.25rem' }}>
          <Heart size={20} color="#f43f5e" fill="#f43f5e" />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f8fafc' }}>
            Most Favorited Recipes (Community Leaderboard)
          </h2>
        </div>

        {business.top_favorites.length === 0 ? (
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>No favorites recorded yet.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {business.top_favorites.map((fav, idx) => {
              const medals = ['🥇', '🥈', '🥉'];
              const medal = medals[idx] || `#${idx + 1}`;

              return (
                <div
                  key={fav.dish_id}
                  style={{
                    background: 'rgba(8, 12, 22, 0.6)',
                    border: '1px solid rgba(255, 255, 255, 0.05)',
                    borderRadius: '8px',
                    padding: '0.875rem 1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <span style={{ fontSize: '1.25rem' }}>{medal}</span>
                    <span style={{ fontWeight: 700, color: '#f8fafc', fontSize: '0.95rem' }}>
                      {fav.dish_id}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fb7185', fontWeight: 700, fontSize: '0.9rem' }}>
                    <Heart size={14} fill="#fb7185" />
                    <span>{fav.favorite_count} favorites</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
