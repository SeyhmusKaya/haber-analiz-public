<?php
require 'vendor/autoload.php';
$app = require 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

$mail = new App\Services\MailService();
echo 'configured: ' . ($mail->isConfigured() ? 'yes' : 'no') . PHP_EOL;
try {
    $body = $mail->buildTestBody();
    $html = $mail->wrapTemplate('Test', $body);
    $mail->send('destek@medyaizle.com', 'Admin', 'Test', $html);
    echo 'SENT OK';
} catch (Throwable $e) {
    echo 'ERROR: ' . $e->getMessage();
}
