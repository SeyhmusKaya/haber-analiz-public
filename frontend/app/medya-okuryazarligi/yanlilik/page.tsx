"use client"

export default function YanlilikPage() {
  const types = [
    { name: "Seçim Yanlılığı", desc: "Sadece belirli bir görüşü destekleyen haberlerin seçilmesi. Diğer perspektifler görmezden gelinir.", example: "Bir kanalın sadece iktidar başarılarını haber yapması, başarısızlıkları es geçmesi." },
    { name: "Başlıklarda Yanıltma", desc: "Haber içeriğinin başlıktaki ile uyuşmaması. Tıklama tuzağı (clickbait) de bu kategoriye girer.", example: "'Ekonomi çöküyor!' başlığı ama içerik sadece %0.5 dalgalanmayı anlatıyor." },
    { name: "Kaynak Yanlılığı", desc: "Sadece tek tarafın kaynaklarının kullanılması veya anonim kaynaklara aşırı güvenilmesi.", example: "'Yetkililer' veya 'kaynaklarımız' gibi doğrulanamaz referanslar." },
    { name: "Çerçeveleme Yanlılığı", desc: "Aynı olayın farklı çerçevelerde sunulması. Kullanılan kelimeler ve vurgular algıyı farklılaştırabilir.", example: "'Özgürlük savaşçısı' vs 'terörist' - aynı kişi için farklı çerçeveler." },
    { name: "İhmal Yanlılığı", desc: "Önemli bilgilerin kasıtlı olarak atlanması veya küçümsenmesi.", example: "Bir çatışmada sadece bir tarafın kayıplarının verilmesi." },
    { name: "Fotografik Yanlılık", desc: "Görsellerin olayı farklı göstermek için seçilmesi veya manipüle edilmesi.", example: "Küçük bir protesto için yakından çekim yaparak kalabalık göstermek." },
  ]

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 20px" }}>
      <h1 style={{ fontSize: 24, fontWeight: 700, color: "var(--color-text)", marginBottom: 8 }}>Medya Yanlılığı Türleri</h1>
      <p style={{ fontSize: 14, color: "var(--color-text-3)", marginBottom: 32, lineHeight: 1.6 }}>
        Medya organlarının habercilik yaparken bilinçli veya bilinçsiz gösterdiği yanlılıkları tanımak, haberleri daha doğru değerlendirmenize yardımcı olur.
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {types.map(t => (
          <div key={t.name} style={{
            background: "var(--color-surface)", border: "1px solid var(--color-border)",
            borderRadius: "var(--radius-lg)", padding: 24,
          }}>
            <h3 style={{ fontSize: 16, fontWeight: 600, color: "var(--color-text)", marginBottom: 8 }}>{t.name}</h3>
            <p style={{ fontSize: 14, color: "var(--color-text-2)", lineHeight: 1.6, marginBottom: 12 }}>{t.desc}</p>
            <div style={{
              padding: "10px 14px", background: "var(--color-surface-2)", borderRadius: "var(--radius-md)",
              fontSize: 13, color: "var(--color-text-3)", fontStyle: "italic", borderLeft: "3px solid var(--color-accent)",
            }}>
              Örnek: {t.example}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
