# fraweb

[PTFraoula](https://ptfraoula.com) online koçluk platformunun web arayüzünün bir anlık görüntüsü: tanıtım sitesi, öğrenci ve koç panelleri, admin hesap ayarları.

> Platformun tamamı (.NET 10 API, web, öğrenci uygulaması, Expo mobil uygulama) özel bir monorepoda geliştiriliyor. Bu repo yalnızca web katmanını gösterir.

## Teknolojiler

- Next.js (App Router), React, TypeScript
- Tailwind CSS
- Subdomain tabanlı yönlendirme (`middleware.ts`): tanıtım, öğrenci, koç ve admin alanları
- Chart.js ile ilerleme grafikleri, driver.js ile ürün içi tanıtım turları

## Çalıştırma

```bash
git clone https://github.com/Oguzhancilesiz/fraweb.git
cd fraweb
npm install
cp .env.production.example .env.local   # NEXT_PUBLIC_API_URL değerini ayarlayın
npm run dev
```

Uygulama `http://localhost:3000` adresinde açılır. Çalışması için PTFraoula API'sine erişim gerekir.
